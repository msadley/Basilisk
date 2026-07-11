import { createLibp2p, type Libp2p } from "libp2p";
import type {
  EventHandler,
  IncomingStreamData,
  Libp2pEvents,
  PeerId,
  PrivateKey,
} from "@libp2p/interface";
import { getLibp2pOptions, type BaseServices } from "@basilisk/libp2p";
import { multiaddr, type Multiaddr } from "@multiformats/multiaddr";
import type { GossipsubEvents } from "@chainsafe/libp2p-gossipsub";

class NodeCore {
  private libp2p: Libp2p<BaseServices>;
  private relayAddress: string;

  private constructor(libp2p: Libp2p<BaseServices>, relayAddress: string) {
    this.libp2p = libp2p;
    this.relayAddress = relayAddress;
  }

  static async init(
    relayAddress: string,
    privateKey: PrivateKey,
  ): Promise<NodeCore> {
    const libp2p = await createLibp2p(
      getLibp2pOptions({ mode: "CLIENT", relayAddress }, privateKey),
    );

    const node = new NodeCore(libp2p, relayAddress);
    return node;
  }

  start() {
    this.libp2p.start();
  }

  stop() {
    this.libp2p.stop();
  }

  async pingRelay(): Promise<number> {
    return this.libp2p.services.ping.ping(multiaddr(this.relayAddress));
  }

  getPeerId(): PeerId {
    return this.libp2p.peerId;
  }

  subscribeToTopic(topic: string) {
    this.libp2p.services.pubsub.subscribe(topic);
  }

  registerProtocolHandler(
    protocol: string,
    handler: (arg0: IncomingStreamData) => any,
  ) {
    this.libp2p.handle(protocol, handler);
  }

  registerEventHandler<K extends keyof Libp2pEvents<BaseServices>>(
    event: K,
    handler: EventHandler<Libp2pEvents<BaseServices>[K]>,
  ) {
    this.libp2p.addEventListener(event, handler);
  }

  registerPubsubHandler<K extends keyof GossipsubEvents>(
    event: K,
    handler: EventHandler<GossipsubEvents[K]>,
  ) {
    this.libp2p.services.pubsub.addEventListener(event, handler);
  }

  async dialProtocol(id: PeerId | Multiaddr, protocol: string) {
    return this.libp2p.dialProtocol(id, protocol);
  }
}

export default NodeCore;
