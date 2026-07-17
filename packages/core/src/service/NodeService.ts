import type { PeerId } from "@libp2p/interface";
import { profileSchema, type Profile } from "../model/Profile.js";
import NodeCore from "../node/NodeCore.js";
import { singleton, inject } from "tsyringe";

@singleton()
class NodeService {
  constructor(
    @inject("NodeCore")
    private nodeCore: NodeCore,
  ) {}

  async getPeerProfile(peerId: PeerId): Promise<Profile> {
    const stream = await this.nodeCore.dialProtocol(peerId, "/info/1.0.0");

    const data = await new Promise((resolve) => {
      stream.addEventListener("message", (event) => {
        resolve(JSON.parse(new TextDecoder().decode(event.data.subarray())));
      });
    });

    await stream.close();
    return profileSchema.assert(data);
  }

  async sendMessage(peerId: PeerId, content: string) {
    const stream = await this.nodeCore.dialProtocol(peerId, "/chat/1.0.0");
    const data = new TextEncoder().encode(content);

    if (!stream.send(data))
      await new Promise((resolve) => stream.addEventListener("drain", resolve));

    await stream.close();
  }

  async pingRelay(): Promise<number> {
    return this.nodeCore.pingRelay();
  }
}

export default NodeService;
