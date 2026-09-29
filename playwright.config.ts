import { defineConfig, devices } from "@playwright/test"

const chromiumLaunchOptions = { args: ["--enable-unsafe-swiftshader"] }

export default defineConfig({
  testDir: "./tests",
  testMatch: ["e2e/**/*.spec.ts", "e2e-learn/**/*.spec.ts"],
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:3132",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"], launchOptions: chromiumLaunchOptions },
    },
    {
      name: "desktop-chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1000 },
        launchOptions: chromiumLaunchOptions,
      },
    },
    {
      name: "mobile-webkit",
      use: { ...devices["iPhone 13"] },
    },
  ],
  webServer: {
    command: "node tests/e2e-learn/server.mjs",
    env: { TEST_SERVER_MODE: "production" },
    url: "http://127.0.0.1:3132/learn",
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
