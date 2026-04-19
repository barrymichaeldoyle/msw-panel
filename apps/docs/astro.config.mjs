// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
  base: "/msw-panel",
  integrations: [
    starlight({
      customCss: ["./src/styles/docs.css"],
      description: "Framework-agnostic devtools for Mock Service Worker.",
      disable404Route: true,
      favicon: "/favicon.svg",
      tagline: "Framework-agnostic Mock Service Worker controls",
      title: "MSW Panel",
      sidebar: [
        {
          label: "Getting started",
          items: ["concepts/overview", "guides/getting-started"],
        },
        {
          label: "Reference",
          items: ["reference/core", "reference/react"],
        },
        {
          label: "Advanced",
          collapsed: true,
          items: [
            "concepts/controller-model",
            "concepts/bridge-transports",
            "guides/react-panel",
            "guides/remote-bridge",
            "guides/node-runtime",
            "guides/remote-inspector",
            "reference/bridge",
          ],
        },
        {
          label: "Roadmap",
          items: ["roadmap/status-and-next-steps"],
        },
      ],
    }),
  ],
  site: "https://barrymichaeldoyle.github.io",
});
