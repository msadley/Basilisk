// src/app/app.ts

import { pingTest } from '../networking/node-handling.js';

async function main() {
  pingTest();
}

main().catch((error) => {
  console.error('Error starting libp2p:', error);
  process.exit(1);
});