import type { PeerId } from "@libp2p/interface";
import { profileSchema, type Profile } from "../model/Profile.js";
import type NodeCore from "../node/NodeCore.js";
import type KnownPeersRepository from "../repository/KnownPeersRepository.js";

class NodeService {
  private knownPeersStore: KnownPeersRepository;
  private nodeCore: NodeCore;

  constructor(knownPeersStore: KnownPeersRepository, nodeCore: NodeCore) {
    this.knownPeersStore = knownPeersStore;
    this.nodeCore = nodeCore;
  }

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

  addKnownPeer(peerId: string) {
    this.knownPeersStore.addPeer(peerId);
  }
}

export default NodeService;
