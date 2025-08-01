import process from 'node:process';
import { kadDHT } from '@libp2p/kad-dht'
import { bootstrap } from '@libp2p/bootstrap'
import { createLibp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp';
import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { multiaddr } from '@multiformats/multiaddr';
import { ping } from '@libp2p/ping';

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
      list: [
        // a list of bootstrap peer multiaddrs to connect to on node startup
        '/ip4/104.131.131.82/tcp/4001/ipfs/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ',
        '/dnsaddr/bootstrap.libp2p.io/ipfs/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
        '/dnsaddr/bootstrap.libp2p.io/ipfs/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa'
      ]
    })
  ]
});

// Start libp2p
await node.start();
console.log('libp2p has started');

// Print peer ID and listening addresses
console.log('Listening on addresses:');
node.getMultiaddrs().forEach((addr) => {
  console.log(addr.toString());
});

// Ping peer if multiaddr is provided
if (process.argv.length >= 3) {
  try {
    const maString = process.argv[2].trim();
    const ma = multiaddr(maString); // IMPORTANT
    console.log(`Pinging remote peer at ${maString}`);
    while (true) {
      const latency = await node.services.ping.ping(ma);
      console.log(`Pinged ${maString} in ${latency}ms`);
    }
  } catch (error) {
    console.error('Ping failed:', error.message);
  }
} else {
  console.log('No remote peer address given, skipping ping');
}

const stop = async () => {
  await node.stop();
  console.log('libp2p has stopped');
  process.exit(0);
};

process.on('SIGTERM', stop);
process.on('SIGINT', stop);