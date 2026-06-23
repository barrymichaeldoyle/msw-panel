// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
  base: "/msw-panel",
  integrations: [
    starlight({
      social: [
        { icon: "github", label: "GitHub", href: "https://github.com/barrymichaeldoyle/msw-panel" },
        { icon: "npm", label: "npm", href: "https://www.npmjs.com/package/msw-panel" },
      ],
      components: {
        ThemeProvider: "./src/components/ThemeProvider.astro",
        ThemeSelect: "./src/components/ThemeSelect.astro",
      },
      customCss: ["./src/styles/docs.css"],
      description: "Framework-agnostic devtools for Mock Service Worker.",
      disable404Route: true,
      favicon: "/favicon.svg",
      logo: { src: "./src/assets/msw-logo.svg" },
      tagline: "Framework-agnostic Mock Service Worker controls",
      title: "MSW Panel",
      sidebar: [
        {
          label: "Getting started",
          items: ["concepts/overview", "guides/getting-started"],
        },
        {
          label: "Features",
          items: ["guides/scenarios", "guides/feature-tags"],
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
