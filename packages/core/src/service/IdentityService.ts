import { createIdentityFromSeed } from "@basilisk/libp2p";
import type { PrivateKey } from "@libp2p/interface";
import { IdentityRepository } from "../repository/IdentityRepository.js";

export class IdentityService {
  constructor(private identityRepository: IdentityRepository) {}

  async getPrivateKey(): Promise<PrivateKey> {
    let seed = await this.identityRepository.getSeed();
    if (seed === undefined) seed = await this.identityRepository.generateSeed();
    return createIdentityFromSeed(seed);
  }
}
