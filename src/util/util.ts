// src/util/util.ts

import path from 'path';
import appRootPath  from 'app-root-path';
import { multiaddr, type Multiaddr } from '@multiformats/multiaddr';
import { getPrivateKeyRaw, readJsonFile, writeJsonFile } from './json.js';
import { generateKeyPair, privateKeyFromRaw } from "@libp2p/crypto/keys";
import { CONFIG_FILE } from '../app/app.js';

export function absolutePath(file : string) {
  return path.join(appRootPath.path, file);
}

export async function pingTest(node : any) {
  await node.start();
  console.log("libp2p has started");

  console.log("Listening on addresses:");
  (node.getMultiaddrs() as Multiaddr[]).forEach((addr: Multiaddr) => {
    console.log(addr.toString());
  });

  if (process.argv.length > 2) {
    await pingPeer(node, multiaddr(process.argv[2]));
  } else {
    console.log("No peer address provided as argument.");
  }

  process.on("SIGTERM", node.stop());
  process.on("SIGINT", node.stop());
}

async function pingPeer(node: any, ma: Multiaddr) {
  try {
    const latency = await node.services.ping.ping(ma);
    console.log(`Pinged ${ma} in ${latency}ms`);
  } catch (error: any) {
    console.error("Ping failed:", error.message);
  }
}

export async function getPrivateKey() {
  let data;
  try {
    data = await getPrivateKeyRaw();
  } catch (error) {
    generatePrivateKey();
    data = await getPrivateKeyRaw();
  }

  return privateKeyFromRaw(Buffer.from(data, "hex"));
}

async function generatePrivateKey() {
  const privateKey = await generateKeyPair("Ed25519");
  const data = await readJsonFile(CONFIG_FILE);
  data["privateKey"] =
    Buffer.from(privateKey.raw).toString("hex") +
    Buffer.from(privateKey.publicKey.raw).toString("hex");
  await writeJsonFile(CONFIG_FILE, data); //TODO verify this works
}