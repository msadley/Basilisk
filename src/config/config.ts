// src/config/config.ts

import { absolutePath, generatePrivateKey } from "../util/util.js";
import { overrideConfig, readJson, writeJson } from "../util/json.js";
import { CONFIG_FILE } from "../app/app.js";
import fs from "fs";

interface Config {
  privateKey: string;
  bootstrapAddresses: string[];
}

export const defaultConfig = (): Config => ({
  privateKey: "to-be-generated",
  bootstrapAddresses: [
    // Some public available nodes for managing discovery and NAT hole-punching
    "/dns4/auto-relay.libp2p.io/tcp/443/wss/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN",
    "/dns4/auto-relay.libp2p.io/tcp/443/wss/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb",
    "/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN",
    "/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa",
    "/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt",
  ],
});

export async function validateConfigFile() {
  try {
    await fs.promises.access(absolutePath(CONFIG_FILE));
    await readJson(CONFIG_FILE);
  } catch (error) {
    // File does not exist or is empty
    await setDefaultConfig();
  }

  const data = await readJson(CONFIG_FILE);
  if (
    data["privateKey"] === undefined ||
    data["privateKey"] === "" ||
    data["privateKey"] === "to-be-generated"
  ) {
    await generatePrivateKey();
  } else if (
    !data["bootstrapAddresses"] ||
    !Array.isArray(data["bootstrapAddresses"])
  ) {
    overrideConfig("bootstrapAddresses", ["ipv4/"]);
  }
}

async function setDefaultConfig() {
  try {
    await writeJson(CONFIG_FILE, defaultConfig());
  } catch (error: any) {
    console.error("An error occurred: ", error);
  }
}
