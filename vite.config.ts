import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 3000,
    open: false,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    chunkSizeWarningLimit: 900, // augmente la limite (warning seulement)
  },
});