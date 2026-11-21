export class MockLibp2pStream extends EventTarget {
  status: "open" | "closing" | "closed" | "aborted" | "reset" = "open";
  writeStatus: "writable" | "closing" | "closed" = "writable";
  remoteWriteStatus: "writable" | "closed" = "writable";
  readBufferLength = 0;

  sentChunks: Uint8Array[] = [];
  abortedError: Error | null = null;
  closedCount = 0;
  sendReturnValue = true;

  send(data: Uint8Array): boolean {
    this.sentChunks.push(data.slice());
    return this.sendReturnValue;
  }

  async close(_options?: { signal?: AbortSignal }): Promise<void> {
    this.closedCount += 1;
    this.writeStatus = "closed";
    this.status = "closed";
  }

  abort(err: Error): void {
    this.abortedError = err;
    this.status = "aborted";
  }

  emitChunk(chunk: Uint8Array): void {
    const evt = new Event("message") as Event & {
      data: { byteLength: number; subarray: () => Uint8Array };
    };
    evt.data = {
      byteLength: chunk.byteLength,
      subarray: () => chunk,
    };
    this.dispatchEvent(evt);
  }

  emitRemoteCloseWrite(): void {
    this.remoteWriteStatus = "closed";
    this.dispatchEvent(new Event("remoteCloseWrite"));
  }

  emitClose(error?: Error): void {
    this.status = "closed";
    const evt = new Event("close") as Event & { error?: Error };
    if (error) {
      evt.error = error;
    }
    this.dispatchEvent(evt);
  }

  emitDrain(): void {
    this.dispatchEvent(new Event("drain"));
  }
}
