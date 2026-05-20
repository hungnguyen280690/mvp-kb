import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
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
    lib: {
      entry: "./src/bootstrap.tsx",
      formats: ["es"],
      fileName: () => "ltt-ui.js",
    },
  },
});
