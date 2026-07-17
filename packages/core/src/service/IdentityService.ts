import type { PrivateKey } from "@basilisk/core";
import IdentityRepository from "../repository/IdentityRepository.js";
import { generateKeyPairFromSeed } from "@libp2p/crypto/keys";
import { inject, singleton } from "tsyringe";

@singleton()
class IdentityService {
  constructor(
    @inject(IdentityRepository)
    private identityRepository: IdentityRepository,
  ) {}

  async getPrivateKey(): Promise<PrivateKey> {
    let seed = await this.identityRepository.getSeed();
    if (seed === undefined) seed = await this.identityRepository.generateSeed();
    return generateKeyPairFromSeed("Ed25519", seed);
  }
}

export default IdentityService;
