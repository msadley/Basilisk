// packages/utils/src/peerId.ts

import { multiaddr, type Multiaddr } from "@multiformats/multiaddr";

export function getPeerId(addr: Multiaddr): string {
  const tuples = addr.getComponents();
  for (const tuple of tuples) {
    const code = tuple.code;
    const value = tuple.value;
    if ((code === 421 || code === 406) && value !== undefined) {
      return value.toString();
    }
  }
  throw new Error("Error when parsing peerId from multiaddr.");
}

export function multiaddrFromPeerId(
  relayAddr: string,
  peerId: string
): Multiaddr {
  const addr: string = `${relayAddr}/p2p-circuit/p2p/${peerId}`;
  return multiaddr(addr);
}
