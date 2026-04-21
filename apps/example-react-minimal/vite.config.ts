import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: process.env.VITE_BASE_URL ?? "/",
  plugins: [react()],
  resolve: {
    alias: {
      "msw-panel/bridge": new URL("../../packages/core/src/bridge.ts", import.meta.url).pathname,
      "msw-panel/react": new URL("../../packages/core/src/react-lazy.tsx", import.meta.url)
        .pathname,
      "msw-panel": new URL("../../packages/core/src/index.ts", import.meta.url).pathname,
    },
  },
});
