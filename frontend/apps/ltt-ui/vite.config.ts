import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  base: "/ltt/",
  plugins: [react()],
  resolve: {
    alias: {
      "@kb/core-utils": path.resolve(
        __dirname,
        "../../packages/core-utils/src/index.ts",
      ),
    },
  },
  server: {
    port: 3001,
    proxy: {
      "/api": {
        target: "http://localhost:8081",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
  },
});
