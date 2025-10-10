// packages/utils/src/peerId.ts

import { type Multiaddr } from "@multiformats/multiaddr";

export function getPeerId(addr: Multiaddr): string | undefined {
  const tuples = addr.getComponents();
  for (const tuple of tuples) {
    const code = tuple.code;
    const value = tuple.value;
    if ((code === 421 || code === 406) && value !== undefined) {
      return value.toString();
    }
  }
  return undefined;
}
