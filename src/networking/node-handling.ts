// src/networking/node-handling.ts

// Networking imports
import { kadDHT } from '@libp2p/kad-dht'
import { bootstrap } from '@libp2p/bootstrap'
import { createLibp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp';
import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { multiaddr, type Multiaddr } from '@multiformats/multiaddr';
import { identify } from '@libp2p/identify';
import type { PeerId } from '@libp2p/interface';

// Miscellaneous imports
import { ping } from '@libp2p/ping';
import process from 'process'; // TODO NEEDS TO BE GONE WHEN FINISHING ALPHA TESTING
import fs, { read } from 'fs'
 
// Local imports
import { absolutePath, readJsonFile, writeJsonFile } from '../util/util.js';
import { CONFIG_FILE } from '../app/app.js';

export class Node {
  private node;

  private constructor(nodeInstance: any) {
    this.node = nodeInstance;
  }

  static async create() {
    const data = await readJsonFile(CONFIG_FILE) || {};
    const peerIdData = data['peerId'];
    const nodeInstance = await createLibp2p({,
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
        identify: identify(),
        dht: kadDHT({}),
      },
      peerDiscovery: [
        bootstrap({
          list: await bootstrapAddresses(),
        })
      ],
      start: false,
      
    });

    return new Node(nodeInstance);
  }

  async start() {
    await (await this.node).start();
  }

  async stop() {
    await (await this.node).stop();
  }

  async generatePeerId() {
    const peerId = await createEd25519PeerId();
    const data = await readJsonFile(CONFIG_FILE) || {};
    data['peerId'] = peerId.privateKey ? Buffer.from(peerId.privateKey).toString('hex') : "";
    await writeJsonFile(CONFIG_FILE, data);
  }

}

function getPeerId(stringId : string){
  return peerIdFromString(stringId);
}

async function getPeerInfo(peerId: PeerId) {
  await node.peerRouting.findPeer(peerId);
}

function bootstrapAddresses() {
  try {
    const data = await readJsonFile(CONFIG_FILE);
    return data['saved-addresses'];
  } catch (error : any) {
    if (error.code === 'ENOENT') {
      const defaultData = { "saved-addresses": [] };
      fs.writeFileSync(absolutePath(CONFIG_FILE), JSON.stringify(defaultData, null, 2));
      return [];
    }
  }
}

async function pingPeer(ma : Multiaddr) {
  try {
    const latency = await node.services.ping.ping(ma);
    console.log(`Pinged ${ma} in ${latency}ms`);
  } catch (error : any) {
    console.error('Ping failed:', error.message);
  }
}

export async function stop() {
  await node.stop();
}

export async function pingTest() {
  await node.start();
  console.log('libp2p has started');

  console.log('Listening on addresses:');
  node.getMultiaddrs().forEach((addr) => {
    console.log(addr.toString());
  });

  if (process.argv.length > 2) {
    await pingPeer(multiaddr(process.argv[2]));
  } else {
    console.log('No peer address provided as argument.');
  }

  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);
}
