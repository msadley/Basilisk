import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import basicSsl from "@vitejs/plugin-basic-ssl";
import sqlocal from "sqlocal/vite";

export default defineConfig({
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
  plugins: [react(), basicSsl(), sqlocal()],
  resolve: {
    alias: {
      "@basilisk/core/models": path.resolve(
        __dirname,
        "../../packages/core/src/models.ts",
      ),
      "@basilisk/core": path.resolve(
        __dirname,
        "../../packages/core/src/index.ts",
      ),
      "@basilisk/libp2p/client": path.resolve(
        __dirname,
        "../../packages/libp2p/src/client.ts",
      ),
      "@basilisk/libp2p": path.resolve(
        __dirname,
        "../../packages/libp2p/src/index.ts",
      ),
    },
  },
  worker: {
    format: "es",
  },
  envDir: "../../",
  base: "./",
});
