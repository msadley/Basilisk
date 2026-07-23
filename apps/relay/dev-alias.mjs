// Simple module aliasing for development (ESM version)
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Register ts-node and tsconfig-paths
import('ts-node').then((tsNode) => {
  tsNode.register({
    project: 'tsconfig.dev.json',
    transpileOnly: true
  });
});

import('tsconfig-paths').then((tsconfigPaths) => {
  tsconfigPaths.register();
});