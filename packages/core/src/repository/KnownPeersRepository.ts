class KnownPeersRepository {
  private knownPeers: Set<string>;

  constructor(knownPeers: string[]) {
    this.knownPeers = new Set(knownPeers);
  }

  addPeer(peerId: string) {
    this.knownPeers.add(peerId);
  }

  removePeer(peerId: string) {
    this.knownPeers.delete(peerId);
  }

  isKnown(peerId: string) {
    return this.knownPeers.has(peerId);
  }
}

export default KnownPeersRepository;
