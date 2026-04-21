import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  use: {
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "pnpm --filter @msw-panel/example-react dev:e2e",
      port: 4173,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: "pnpm --filter @msw-panel/example-react-minimal dev:e2e",
      port: 4174,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command:
        "VITE_SHOW_MSW_PANEL_IN_PRODUCTION=true pnpm --filter @msw-panel/example-react build && pnpm --filter @msw-panel/example-react exec vite preview --host 127.0.0.1 --port 4175",
      port: 4175,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
  projects: [
    {
      name: "example-react",
      testMatch: /example-react\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://127.0.0.1:4173",
      },
    },
    {
      name: "example-react-minimal",
      testMatch: /example-react-minimal\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://127.0.0.1:4174",
      },
    },
    {
      name: "example-react-production-demo",
      testMatch: /example-react-production\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://127.0.0.1:4175",
      },
    },
  ],
});
