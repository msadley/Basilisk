import type { PeerId } from "@libp2p/interface";
import { profileSchema, type Profile } from "../model/Profile.js";
import { NodeCore } from "../node/NodeCore.js";
import { MessagePacket } from "../model/MessagePacket.js";

export class NodeService {
  constructor(private nodeCore: NodeCore) {}

  async getPeerProfile(peerId: PeerId): Promise<Profile> {
    const stream = await this.nodeCore.dialProtocol(peerId, "/info/1.0.0");

    const raw: unknown = await new Promise((resolve) => {
      stream.addEventListener("message", (event) => {
        resolve(JSON.parse(new TextDecoder().decode(event.data.subarray())));
      });
    });

    await stream.close();

    const normalized =
      raw &&
      typeof raw === "object" &&
      "avatar" in raw &&
      Array.isArray(raw.avatar)
        ? { ...raw, avatar: new Uint8Array(raw.avatar) }
        : raw;

    const profile = profileSchema.assert(normalized);
    if (profile.id !== peerId.toString()) {
      throw new Error("Profile ID does not match remote peer ID");
    }
    return profile;
  }

  async sendMessage(peerId: PeerId, messagePacket: MessagePacket) {
    const stream = await this.nodeCore.dialProtocol(peerId, "/chat/1.0.0");
    const data = new TextEncoder().encode(JSON.stringify(messagePacket));

    if (!stream.send(data))
      await new Promise((resolve) => stream.addEventListener("drain", resolve));

    await stream.close();
  }

  async pingRelay(): Promise<number> {
    return this.nodeCore.pingRelay();
  }

  async start(): Promise<void> {
    return this.nodeCore.start();
  }
}
