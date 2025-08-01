import process from 'node:process';
import { kadDHT } from '@libp2p/kad-dht'
import { bootstrap } from '@libp2p/bootstrap'
import { createLibp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp';
import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { multiaddr } from '@multiformats/multiaddr';
import { ping } from '@libp2p/ping';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const node = await createLibp2p({
  addresses: {
    listen: ['/ip4/0.0.0.0/tcp/0'],
  },
  transports: [tcp()],
  connectionEncrypters: [noise()],
  streamMuxers: [yamux()],
  services: {
    dht: kadDHT({}), // TODO ADD OPTIONS TO DHT
    ping: ping({
      protocolPrefix: 'ipfs', // default
    }),
    identify: identify()
  },
  peerDiscovery: [
    bootstrap({
      list: readJsonFile('data.json').then(data => data['saved-addresses'] || []),
    })
  ]
});

async function readJsonFile(fileName) {

  try {
    const filePath = path.join(__dirname, fileName);

    const jsonString = await fs.readFile(filePath, 'utf8');

    const data = JSON.parse(jsonString);

    return data;

  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error(`Error: The file '${fileName}' was not found.`);
    } else {
      console.error("An error occurred:", err);
    }
  }
}

async function pingRemotePeer(ma) {
  try {
    const latency = await node.services.ping.ping(ma);
    console.log(`Pinged ${maString} in ${latency}ms`);
  } catch (error) {
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

  // Print peer ID and listening addresses
  console.log('Listening on addresses:');
  node.getMultiaddrs().forEach((addr) => {
    console.log(addr.toString());
  });

  const maString = prompt("Insert the remote node address: ").trim();
  const ma = multiaddr(maString); // IMPORTANT

  pingRemotePeer(ma);

  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);

}

main().catch((error) => {
  console.error("An error ocurred: ", error)
});