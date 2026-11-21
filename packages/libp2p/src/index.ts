import type { PrivateKey } from "@libp2p/interface";
import type { Libp2pOptions } from "libp2p";
import type { BaseServices } from "./base.js";
import { getClientLibp2pOptions } from "./client.js";
import { getRelayLibp2pOptions, type RelayServices } from "./relay.js";

export type { BaseServices, RelayServices };

export type Libp2pConfig =
  | {
      mode: "CLIENT";
      relayAddress: string;
    }
  | {
      mode: "RELAY";
      publicDns: string;
    };

export function getLibp2pOptions(
  options: { mode: "CLIENT"; relayAddress: string },
  privateKey: PrivateKey,
): Libp2pOptions<BaseServices>;
export function getLibp2pOptions(
  options: { mode: "RELAY"; publicDns: string },
  privateKey: PrivateKey,
): Libp2pOptions<RelayServices>;
export function getLibp2pOptions(
  options: Libp2pConfig,
  privateKey: PrivateKey,
): Libp2pOptions<BaseServices> | Libp2pOptions<RelayServices>;
export function getLibp2pOptions(
  options: Libp2pConfig,
  privateKey: PrivateKey,
): Libp2pOptions<BaseServices> | Libp2pOptions<RelayServices> {
  if (options.mode === "CLIENT") {
    return getClientLibp2pOptions(options.relayAddress, privateKey);
  }
  return getRelayLibp2pOptions(options.publicDns, privateKey);
}

export {
  IDENTITY_SEED_LENGTH,
  generateIdentitySeed,
  createIdentityFromSeed,
} from "./identity.js";
