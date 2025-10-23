import { multiaddr, type Multiaddr } from "@multiformats/multiaddr";

export function getPeerId(addr: Multiaddr): string {
  let components = addr.getComponents();

  const circuitIndex = components.findIndex((c) => c.code === 290); // 290 is p2p-circuit
  if (circuitIndex > -1) {
    components = components.slice(circuitIndex + 1);
  }

  const p2pComponent = components.find((c) => c.code === 421); // 421 is p2p

  if (p2pComponent?.value == null) {
    throw new Error("Error when parsing peerId from multiaddr.");
  }

  return p2pComponent.value;
}

export function multiaddrFromPeerId(
  relayAddr: string,
  peerId: string
): Multiaddr {
  const addr: string = `${relayAddr}/p2p-circuit/p2p/${peerId}`;
  return multiaddr(addr);
}
