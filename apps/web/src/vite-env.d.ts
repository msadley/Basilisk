/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RELAY_MULTIADDRESS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
