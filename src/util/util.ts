// src/util/util.ts

import path from "path";
import appRootPath from "app-root-path";
import { multiaddr, type Multiaddr } from "@multiformats/multiaddr";
import { getPrivateKeyRaw, overrideConfig } from "./json.js";
import { generateKeyPair, privateKeyFromRaw } from "@libp2p/crypto/keys";

/**
 * Returns the absolute path of a file.
 * @param {string} file - The file to get the absolute path of.
 * @returns {string} The absolute path of the file.
 */
export function absolutePath(file: string) {
  return path.join(appRootPath.path, file);
}

/**
 * Pings a peer to test the connection.
 * @param {any} node - The libp2p node.
 */
export async function pingTest(node: any) {
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

/**
 * Pings a peer.
 * @param {any} node - The libp2p node.
 * @param {Multiaddr} ma - The multiaddress of the peer to ping.
 */
async function pingPeer(node: any, ma: Multiaddr) {
  try {
    const latency = await node.services.ping.ping(ma);
    console.log(`Pinged ${ma} in ${latency}ms`);
  } catch (error: any) {
    console.error("Ping failed:", error.message);
  }
}

/**
 * Gets the private key from the config file, or generates a new one if it doesn't exist.
 * @returns {Promise<any>} A promise that resolves to the private key.
 */
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

/**
 * Generates a new private key and saves it to the config file.
 */
async function generatePrivateKey() {
  const privateKey = await generateKeyPair("Ed25519");
  overrideConfig(
    "privateKey",
    Buffer.from(privateKey.raw).toString("hex") +
      Buffer.from(privateKey.publicKey.raw).toString("hex")
  );
}