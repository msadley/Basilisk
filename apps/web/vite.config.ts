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
      "@basilisk/core": path.resolve(__dirname, "../../packages/core/src/index.ts"),
      "app-root-path": path.resolve(__dirname, "./src/mocks/empty.js"),
    },
  },
  worker: {
    format: "es",
  },
  envDir: "../../",
  base: "./",
});
