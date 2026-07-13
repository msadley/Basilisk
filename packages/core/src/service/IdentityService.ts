import type { PrivateKey } from "@basilisk/core";
import type IdentityRepository from "../repository/IdentityRepository.js";
import { generateKeyPairFromSeed } from "@libp2p/crypto/keys";

class IdentityService {
  private identityRepository: IdentityRepository;

  constructor(identityRepository: IdentityRepository) {
    this.identityRepository = identityRepository;
  }

  async getPrivateKey(): Promise<PrivateKey> {
    let seed = await this.identityRepository.getSeed();
    if (seed === undefined) seed = await this.identityRepository.generateSeed();
    return generateKeyPairFromSeed("Ed25519", seed);
  }
}

export default IdentityService;
