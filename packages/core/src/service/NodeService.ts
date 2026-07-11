import type { PeerId } from "@libp2p/interface";
import { parseDataFromStream, sendDataToStream } from "../utils.js";
import { profileSchema, type Profile } from "../model/Profile.js";
import type KnownPeersRepository from "../repository/KnownPeersRepository.js";
import type NodeCore from "../node/NodeCore.js";

class NodeService {
  private knownPeersStore: KnownPeersRepository;
  private nodeCore: NodeCore;

  constructor(knownPeersStore: KnownPeersRepository, nodeCore: NodeCore) {
    this.knownPeersStore = knownPeersStore;
    this.nodeCore = nodeCore;
  }

  async getPeerProfile(peerId: PeerId): Promise<Profile> {
    return parseDataFromStream(
      await this.nodeCore.dialProtocol(peerId, "/info/1.0.0"),
      profileSchema,
    );
  }

  async sendMessageToPeerId(peerId: PeerId, content: string) {
    sendDataToStream(
      await this.nodeCore.dialProtocol(peerId, "/chat/1.0.0"),
      content,
    );
  }

  async pingRelay(): Promise<number> {
    return this.nodeCore.pingRelay();
  }

  addKnownPeer(peerId: string) {
    this.knownPeersStore.addPeer(peerId);
  }
}

export default NodeService;
