import type { Stream } from "@libp2p/interface";
import { describe, expect, it } from "vitest";
import {
  base64ToUint8Array,
  readStreamJson,
  uint8ArrayToBase64,
  writeStreamJson,
} from "../src/node/stream.js";
import { MockLibp2pStream } from "./mockStream.js";

describe("libp2p stream framing and base64 helpers", () => {
  it("round-trips empty, small, and large (100 KB) payloads via uint8ArrayToBase64 / base64ToUint8Array without stack overflow", () => {
    const empty = new Uint8Array(0);
    expect(uint8ArrayToBase64(empty)).toBe("");
    expect(base64ToUint8Array("")).toEqual(empty);

    const small = new Uint8Array([0, 1, 2, 127, 128, 254, 255]);
    const smallB64 = uint8ArrayToBase64(small);
    expect(base64ToUint8Array(smallB64)).toEqual(small);

    // 100 KB payload exceeding typical call stack arg limits (65536)
    const large = new Uint8Array(100 * 1024);
    for (let i = 0; i < large.byteLength; i++) {
      large[i] = (i * 31 + 17) & 0xff;
    }
    const largeB64 = uint8ArrayToBase64(large);
    const decodedLarge = base64ToUint8Array(largeB64);
    expect(decodedLarge).toEqual(large);
  });

  it("reassembles multi-chunk JSON payloads in readStreamJson and writes JSON with writeStreamJson", async () => {
    const writeMock = new MockLibp2pStream();
    const payload = {
      senderId: "12D3KooWTestPeer",
      chatId: "12D3KooWTestPeer",
      contentType: "text",
      content: "Multi-chunk framed JSON payload ".repeat(50),
    };

    await writeStreamJson(writeMock as unknown as Stream, payload);
    expect(writeMock.sentChunks).toHaveLength(1);
    expect(writeMock.closedCount).toBe(1);

    const fullBytes = writeMock.sentChunks[0];
    expect(fullBytes.byteLength).toBeGreaterThan(500);

    // Split into 7 uneven chunks and feed into readStreamJson
    const readMock = new MockLibp2pStream();
    const readPromise = readStreamJson(readMock as unknown as Stream);

    const chunkSize = Math.ceil(fullBytes.byteLength / 7);
    for (let offset = 0; offset < fullBytes.byteLength; offset += chunkSize) {
      readMock.emitChunk(
        fullBytes.subarray(
          offset,
          Math.min(offset + chunkSize, fullBytes.byteLength),
        ),
      );
    }
    readMock.emitRemoteCloseWrite();

    const parsed = await readPromise;
    expect(parsed).toEqual(payload);
    expect(readMock.closedCount).toBe(1);
  });

  it("waits for drain when stream.send returns false in writeStreamJson", async () => {
    const mock = new MockLibp2pStream();
    mock.sendReturnValue = false;

    const writePromise = writeStreamJson(mock as unknown as Stream, {
      ok: true,
    });
    setTimeout(() => {
      mock.emitDrain();
    }, 10);

    await writePromise;
    expect(mock.sentChunks).toHaveLength(1);
    expect(mock.closedCount).toBe(1);
  });

  it("rejects and aborts when stream closes without sending any data", async () => {
    const mock = new MockLibp2pStream();
    const readPromise = readStreamJson(mock as unknown as Stream);

    mock.emitRemoteCloseWrite();

    await expect(readPromise).rejects.toThrow(
      "Stream closed without sending any data",
    );
    expect(mock.abortedError?.message).toBe(
      "Stream closed without sending any data",
    );
  });

  it("rejects and aborts on malformed JSON", async () => {
    const mock = new MockLibp2pStream();
    const readPromise = readStreamJson(mock as unknown as Stream);

    mock.emitChunk(new TextEncoder().encode("{ invalid json "));
    mock.emitRemoteCloseWrite();

    await expect(readPromise).rejects.toThrow();
    expect(mock.abortedError).toBeInstanceOf(Error);
  });

  it("rejects and aborts immediately when payload exceeds maxBytes", async () => {
    const mock = new MockLibp2pStream();
    const readPromise = readStreamJson(mock as unknown as Stream, {
      maxBytes: 32,
    });

    mock.emitChunk(new Uint8Array(20));
    mock.emitChunk(new Uint8Array(20));

    await expect(readPromise).rejects.toThrow(
      "Stream payload exceeded maximum size of 32 bytes",
    );
    expect(mock.abortedError?.message).toBe(
      "Stream payload exceeded maximum size of 32 bytes",
    );
  });
});
