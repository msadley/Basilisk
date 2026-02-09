/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BOOTSTRAP_MULTIADDRS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
