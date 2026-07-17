import { getLibp2pOptions, type BaseServices } from "@basilisk/libp2p";
import type { GossipSubEvents } from "@libp2p/gossipsub";
import type {
  EventHandler,
  Libp2pEvents,
  PeerId,
  PrivateKey,
  StreamHandler,
} from "@libp2p/interface";
import { multiaddr, type Multiaddr } from "@multiformats/multiaddr";
import { createLibp2p, type Libp2p } from "libp2p";

class NodeCore {
  private libp2p: Libp2p<BaseServices>;
  private relayMultiaddress: Multiaddr;

  private constructor(
    libp2p: Libp2p<BaseServices>,
    relayMultiaddress: Multiaddr,
  ) {
    this.libp2p = libp2p;
    this.relayMultiaddress = relayMultiaddress;
  }

  static async init(
    relayAddress: string,
    privateKey: PrivateKey,
  ): Promise<NodeCore> {
    const relayMultiaddr = multiaddr(relayAddress);
    const libp2p = await createLibp2p(
      getLibp2pOptions({ mode: "CLIENT", relayAddress }, privateKey),
    );
    return new NodeCore(libp2p, relayMultiaddr);
  }

  start() {
    this.libp2p.start();
  }

  stop() {
    this.libp2p.stop();
  }

  async pingRelay(): Promise<number> {
    return this.libp2p.services.ping.ping(this.relayMultiaddress);
  }

  getPeerId(): PeerId {
    return this.libp2p.peerId;
  }

  subscribeToTopic(topic: string) {
    this.libp2p.services.pubsub.subscribe(topic);
  }

  registerProtocolHandler(protocol: string, handler: StreamHandler) {
    this.libp2p.handle(protocol, handler);
  }

  registerEventListener<K extends keyof Libp2pEvents<BaseServices>>(
    event: K,
    handler: EventHandler<Libp2pEvents<BaseServices>[K]>,
  ) {
    this.libp2p.addEventListener(event, handler);
  }

  registerPubsubListener<K extends keyof GossipSubEvents>(
    event: K,
    handler: EventHandler<GossipSubEvents[K]>,
  ) {
    this.libp2p.services.pubsub.addEventListener(event, handler);
  }

  async dialProtocol(id: PeerId | Multiaddr, protocol: string) {
    return this.libp2p.dialProtocol(id, protocol);
  }
}

export default NodeCore;
