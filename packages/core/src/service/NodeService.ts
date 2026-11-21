import type { PeerId } from "@libp2p/interface";
import { profileSchema, type Profile } from "../model/Profile.js";
import { NodeCore } from "../node/NodeCore.js";
import {
  base64ToUint8Array,
  readStreamJson,
  uint8ArrayToBase64,
  writeStreamJson,
} from "../node/stream.js";
import { MessagePacket } from "../model/MessagePacket.js";

export class NodeService {
  constructor(private nodeCore: NodeCore) {}

  async getPeerProfile(peerId: PeerId): Promise<Profile> {
    const stream = await this.nodeCore.dialProtocol(peerId, "/info/1.0.0");
    let raw: unknown;
    try {
      raw = await readStreamJson(stream);
    } catch (error) {
      stream.abort(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }

    let normalized: unknown = raw;
    if (
      raw &&
      typeof raw === "object" &&
      !Array.isArray(raw) &&
      "avatar" in raw
    ) {
      if (typeof raw.avatar === "string") {
        normalized = { ...raw, avatar: base64ToUint8Array(raw.avatar) };
      } else if (
        Array.isArray(raw.avatar) &&
        raw.avatar.every(
          (item) =>
            typeof item === "number" &&
            Number.isInteger(item) &&
            item >= 0 &&
            item <= 255,
        )
      ) {
        normalized = { ...raw, avatar: new Uint8Array(raw.avatar) };
      }
    }

    const profile = profileSchema.assert(normalized);
    if (profile.id !== peerId.toString()) {
      throw new Error("Profile ID does not match remote peer ID");
    }
    return profile;
  }

  async sendMessage(peerId: PeerId, messagePacket: MessagePacket) {
    const stream = await this.nodeCore.dialProtocol(peerId, "/chat/1.0.0");
    try {
      const payload =
        messagePacket.contentType === "image" ||
        messagePacket.contentType === "file"
          ? {
              ...messagePacket,
              content: uint8ArrayToBase64(messagePacket.content),
            }
          : messagePacket;

      await writeStreamJson(stream, payload);
    } catch (error) {
      stream.abort(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async pingRelay(): Promise<number> {
    return this.nodeCore.pingRelay();
  }

  async start(): Promise<void> {
    return this.nodeCore.start();
  }
}
