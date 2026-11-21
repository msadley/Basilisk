import type {
  Stream,
  StreamCloseEvent,
  StreamMessageEvent,
} from "@libp2p/interface";

export const DEFAULT_MAX_STREAM_BYTES = 10 * 1024 * 1024; // 10 MiB
export const DEFAULT_STREAM_TIMEOUT_MS = 30_000;

const BASE64_CHUNK_SIZE = 0x4000;

export interface ReadStreamJsonOptions {
  maxBytes?: number;
  timeoutMs?: number;
}

export interface WriteStreamJsonOptions {
  timeoutMs?: number;
}

export function uint8ArrayToBase64(bytes: Uint8Array): string {
  if (bytes.byteLength === 0) {
    return "";
  }

  const parts: string[] = [];
  for (let offset = 0; offset < bytes.byteLength; offset += BASE64_CHUNK_SIZE) {
    const chunk = bytes.subarray(
      offset,
      Math.min(offset + BASE64_CHUNK_SIZE, bytes.byteLength),
    );
    parts.push(String.fromCharCode(...chunk));
  }
  return btoa(parts.join(""));
}

export function base64ToUint8Array(b64: string): Uint8Array {
  if (b64.length === 0) {
    return new Uint8Array(0);
  }

  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function concatChunks(chunks: Uint8Array[], totalBytes: number): Uint8Array {
  const combined = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return combined;
}

function safeAbort(stream: Stream, error: Error): void {
  try {
    stream.abort(error);
  } catch {
    // Ignore errors when aborting an already-closed stream
  }
}

async function closeStream(stream: Stream, timeoutMs: number): Promise<void> {
  if (
    stream.status === "closed" ||
    stream.status === "aborted" ||
    stream.status === "reset" ||
    stream.writeStatus === "closed" ||
    stream.writeStatus === "closing"
  ) {
    return;
  }

  if (!(timeoutMs > 0 && Number.isFinite(timeoutMs))) {
    await stream.close();
    return;
  }

  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;

  const closePromise = stream.close({ signal: controller.signal });
  // Prevent unhandled rejection if the timeout wins the race first
  closePromise.catch(() => {});

  try {
    await Promise.race([
      closePromise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          const error = new Error(
            `Timed out closing stream after ${timeoutMs}ms`,
          );
          controller.abort(error);
          safeAbort(stream, error);
          reject(error);
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
  }
}

export async function readStreamJson(
  stream: Stream,
  options?: ReadStreamJsonOptions,
): Promise<unknown> {
  const maxBytes = options?.maxBytes ?? DEFAULT_MAX_STREAM_BYTES;
  const timeoutMs = options?.timeoutMs ?? DEFAULT_STREAM_TIMEOUT_MS;

  const payload = await new Promise<unknown>((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const cleanup = () => {
      if (timer !== undefined) {
        clearTimeout(timer);
        timer = undefined;
      }
      stream.removeEventListener("message", onMessage);
      stream.removeEventListener("remoteCloseWrite", onRemoteCloseWrite);
      stream.removeEventListener("close", onClose);
    };

    const fail = (error: Error, shouldAbort: boolean) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (shouldAbort) {
        safeAbort(stream, error);
      }
      reject(error);
    };

    const finalize = () => {
      if (settled) return;
      settled = true;
      cleanup();

      if (totalBytes === 0) {
        const error = new Error("Stream closed without sending any data");
        safeAbort(stream, error);
        reject(error);
        return;
      }

      try {
        const combined = concatChunks(chunks, totalBytes);
        const decoded = new TextDecoder("utf-8", { fatal: true }).decode(
          combined,
        );
        const parsed: unknown = JSON.parse(decoded);
        resolve(parsed);
      } catch (err) {
        const error =
          err instanceof Error
            ? err
            : new Error(`Failed to decode JSON stream: ${String(err)}`);
        safeAbort(stream, error);
        reject(error);
      }
    };

    const onMessage = (evt: StreamMessageEvent) => {
      if (settled) return;

      const incomingLength = evt.data.byteLength;
      if (totalBytes + incomingLength > maxBytes) {
        fail(
          new Error(`Stream payload exceeded maximum size of ${maxBytes} bytes`),
          true,
        );
        return;
      }

      if (incomingLength > 0) {
        const chunk = evt.data.subarray();
        chunks.push(chunk);
        totalBytes += chunk.byteLength;
      }

      if (
        stream.remoteWriteStatus === "closed" &&
        (stream.readBufferLength ?? 0) === 0
      ) {
        finalize();
      }
    };

    const onRemoteCloseWrite = () => {
      finalize();
    };

    const onClose = (evt: StreamCloseEvent) => {
      if (evt.error != null) {
        fail(evt.error, false);
        return;
      }
      finalize();
    };

    if (stream.status === "aborted" || stream.status === "reset") {
      fail(new Error(`Stream is already ${stream.status}`), false);
      return;
    }

    if (
      (stream.status === "closed" || stream.remoteWriteStatus === "closed") &&
      (stream.readBufferLength ?? 0) === 0
    ) {
      finalize();
      return;
    }

    if (timeoutMs > 0 && Number.isFinite(timeoutMs)) {
      timer = setTimeout(() => {
        fail(
          new Error(`Timed out reading from stream after ${timeoutMs}ms`),
          true,
        );
      }, timeoutMs);
    }

    stream.addEventListener("message", onMessage);
    stream.addEventListener("remoteCloseWrite", onRemoteCloseWrite);
    stream.addEventListener("close", onClose);
  });

  await closeStream(stream, timeoutMs);
  return payload;
}

export async function writeStreamJson(
  stream: Stream,
  payload: unknown,
  options?: WriteStreamJsonOptions,
): Promise<void> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_STREAM_TIMEOUT_MS;
  const serialized = JSON.stringify(payload);
  if (serialized === undefined) {
    throw new Error("Cannot serialize undefined payload to JSON");
  }

  const data = new TextEncoder().encode(serialized);

  if (!stream.send(data)) {
    if (
      stream.status === "closed" ||
      stream.status === "aborted" ||
      stream.status === "reset"
    ) {
      throw new Error(`Stream ${stream.status} before drain`);
    }

    await new Promise<void>((resolve, reject) => {
      let settled = false;
      let timer: ReturnType<typeof setTimeout> | undefined;

      const cleanup = () => {
        if (timer !== undefined) {
          clearTimeout(timer);
          timer = undefined;
        }
        stream.removeEventListener("drain", onDrain);
        stream.removeEventListener("close", onClose);
      };

      const onDrain = () => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve();
      };

      const onClose = (evt: StreamCloseEvent) => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(evt.error ?? new Error("Stream closed before drain"));
      };

      if (timeoutMs > 0 && Number.isFinite(timeoutMs)) {
        timer = setTimeout(() => {
          if (settled) return;
          settled = true;
          cleanup();
          const error = new Error(
            `Timed out waiting for stream drain after ${timeoutMs}ms`,
          );
          safeAbort(stream, error);
          reject(error);
        }, timeoutMs);
      }

      stream.addEventListener("drain", onDrain, { once: true });
      stream.addEventListener("close", onClose, { once: true });
    });
  }

  await closeStream(stream, timeoutMs);
}
