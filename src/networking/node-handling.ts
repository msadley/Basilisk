// src/networking/node-handling.js

// Networking imports
import { kadDHT } from '@libp2p/kad-dht'
import { bootstrap } from '@libp2p/bootstrap'
import { createLibp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp';
import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { multiaddr } from '@multiformats/multiaddr';
import { identify } from '@libp2p/identify';
import type { Multiaddr, MultiaddrInput } from '@multiformats/multiaddr';

// Miscellaneous imports
import { ping } from '@libp2p/ping';
import path from 'path';
import { fileURLToPath } from 'url';
import process from 'process';
import promptSync from 'prompt-sync';
import { readJsonFile } from '../util/util.js';
import fs from 'fs'
 
const __filename : string = fileURLToPath(import.meta.url);
const __dirname : string = path.dirname(__filename);

async function bootstrapAddresses() {
  try {
    const data = await readJsonFile('dist/network/data/data.json');
    return data['saved-addresses'];
  } catch (error : any) {
    if (error.code === 'ENOENT') {
      const data = await readJsonFile('default/data.json');
      fs.writeFileSync(path.join(__dirname, 'data/data.json'), JSON.stringify(data, null, 2));
      console.error(`Error: The file 'data/data.json' was not found. Created a new one.`);
      return data['saved-addresses'];
    }
  }
}

const node = await createLibp2p({
  addresses: {
    listen: ['/ip4/127.0.0.1/tcp/0'],
  },
  transports: [
    tcp(),
  ],
  connectionEncrypters: [noise()],
  streamMuxers: [yamux()],
  services: {
    ping: ping(),
    identify: identify()
  },
  peerDiscovery: [
    bootstrap({
      list: await bootstrapAddresses(),
    })
  ],
});

async function pingPeer(ma : Multiaddr) {
  try {
    const latency = await node.services.ping.ping(ma);
    console.log(`Pinged ${ma} in ${latency}ms`);
  } catch (error : any) {
    console.error('Ping failed:', error.message);
  }
}

const stop = async () => {
  await node.stop();
  console.log('libp2p has stopped');
  process.exit(0);
};

async function main() {
  await node.start();
  console.log('libp2p has started');

  console.log('Listening on addresses:');
  node.getMultiaddrs().forEach((addr) => {
    console.log(addr.toString());
  });

  try {
    const maString : string = promptSync()("Insert the remote node address: ").trim();
    if (maString) {
      await pingPeer(multiaddr(maString));
    } else {
      console.log('No address provided. Exiting.');
    }
  } catch (error : any) {
    console.error('Invalid multiaddress provided:', error.message);
  } finally {
    await stop();
  }

  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);
}

main().catch((error) => {
  console.error("An error ocurred: ", error)
  process.exit(1);
});