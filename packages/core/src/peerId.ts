import { multiaddr, type Multiaddr } from "@multiformats/multiaddr";

export function getPeerId(addr: string): string {
  const components = addr.split("/");

  let lastP2pIndex = -1;
  for (let i = components.length - 1; i >= 0; i--) {
    if (components[i] === "p2p") {
      lastP2pIndex = i;
      break;
    }
  }

  if (lastP2pIndex === -1) {
    throw new Error("Error when parsing peerId from multiaddr.");
  }

  const peerId = components[lastP2pIndex + 1];

  if (!peerId) {
    throw new Error(`Error when parsing peerId from multiaddr: ${addr}`);
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
