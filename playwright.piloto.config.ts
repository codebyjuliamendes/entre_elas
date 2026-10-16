import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "node:fs";
export default defineConfig({
  testDir: "./tests/piloto-e2e",
  outputDir: ".local/piloto-test-results",
  workers: 1,
  timeout: 60000,
  expect: { timeout: 15000 },
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3400",
    ...devices["iPhone 13"],
    defaultBrowserType: "chromium",
    trace: "retain-on-failure",
    launchOptions: {
      executablePath:
        process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ??
        (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
      args: ["--no-sandbox"],
    },
  },
  webServer: {
    command: "node tests/fixtures/piloto-servidor.mjs",
    url: "http://127.0.0.1:3400/entrar",
    reuseExistingServer: false,
    timeout: 60000,
  },
});
