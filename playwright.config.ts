import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:4321",
    trace: "retain-on-failure",
    launchOptions: {
      args: ["--disable-gpu", "--disable-software-rasterizer", "--no-sandbox"],
    },
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
    { name: "webkit", use: { browserName: "webkit" } },
  ],
  webServer: {
    command: "pnpm dev --port 4321 --host 127.0.0.1",
    url: "http://127.0.0.1:4321/api/health",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
