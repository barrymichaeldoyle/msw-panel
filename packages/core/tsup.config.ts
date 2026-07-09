import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/react.tsx", "src/react-lazy.tsx", "src/bridge.ts"],
  format: ["esm", "cjs"],
  dts: {
    // tsup's rollup-plugin-dts path injects `baseUrl`, which TypeScript 6
    // treats as a hard error unless deprecations are ignored. TypeScript 7's
    // `tsc` does not need this; only the TS 6 API used for .d.ts bundling does.
    compilerOptions: {
      ignoreDeprecations: "6.0",
    },
  },
});
