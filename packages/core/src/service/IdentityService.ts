import { PrivateKey } from "@libp2p/interface";
import { IdentityRepository } from "../repository/IdentityRepository.js";
import { generateKeyPairFromSeed } from "@libp2p/crypto/keys";

export class IdentityService {
  constructor(private identityRepository: IdentityRepository) {}

  async getPrivateKey(): Promise<PrivateKey> {
    let seed = await this.identityRepository.getSeed();
    if (seed === undefined) seed = await this.identityRepository.generateSeed();
    return generateKeyPairFromSeed("Ed25519", seed);
  }
}
