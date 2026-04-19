import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "msw-panel/bridge": new URL("../../packages/core/src/bridge.ts", import.meta.url).pathname,
      "msw-panel/react": new URL("../../packages/core/src/react.tsx", import.meta.url).pathname,
      "msw-panel": new URL("../../packages/core/src/index.ts", import.meta.url).pathname,
    },
  },
});
