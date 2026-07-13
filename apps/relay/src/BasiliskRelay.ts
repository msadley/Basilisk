import type { PrivateKey } from "@basilisk/core";
import { getLibp2pOptions } from "@basilisk/libp2p";
import { createLibp2p, type Libp2p } from "libp2p";

class BasiliskRelay {
  private libp2p: Libp2p;

  private constructor(libp2p: Libp2p) {
    this.libp2p = libp2p;
  }

  static async init(
    publicDns: string,
    privateKey: PrivateKey,
  ): Promise<BasiliskRelay> {
    const libp2p = await createLibp2p(
      getLibp2pOptions({ mode: "RELAY", publicDns }, privateKey),
    );
    return new BasiliskRelay(libp2p);
  }

  async start(): Promise<void> {
    await this.libp2p.start();
    console.log("Relay started: ", this.libp2p.getMultiaddrs());
  }
}

export default BasiliskRelay;
