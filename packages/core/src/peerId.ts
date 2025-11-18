import { multiaddr, type Multiaddr } from "@multiformats/multiaddr";

export function getPeerId(addr: string): string {
  const components = addr.split("/");

  const p2pComponent = components.find((c) => c === "p2p");

  if (!p2pComponent) {
    throw new Error("Error when parsing peerId from multiaddr.");
  }

  const p2pComponentIndex = components.indexOf(p2pComponent);
  const peerId = components[p2pComponentIndex + 1];

  if (!peerId) {
    throw new Error("Error when parsing peerId from multiaddr.");
  }

  return peerId;
}

export function multiaddrFromPeerId(
  relayAddr: string,
  peerId: string
): Multiaddr {
  const addr: string = `${relayAddr}/p2p-circuit/p2p/${peerId}`;
  return multiaddr(addr);
}
