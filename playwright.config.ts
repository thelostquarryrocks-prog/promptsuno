import { defineConfig, devices } from '@playwright/test'

const chromiumLaunchOptions = { args: ['--enable-unsafe-swiftshader'] }

export default defineConfig({
  testDir: './tests',
  testMatch: ['e2e/**/*.spec.ts', 'e2e-learn/**/*.spec.ts'],
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120000,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:3131',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'], launchOptions: chromiumLaunchOptions } },
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 }, launchOptions: chromiumLaunchOptions } },
    { name: 'mobile-webkit', use: { ...devices['iPhone 13'] } },
  ],
  webServer: {
    command: 'node tests/e2e/server.mjs',
    env: { TEST_SERVER_MODE: 'production' },
    url: 'http://127.0.0.1:3131/login',
    reuseExistingServer: false,
    timeout: 180000,
  },
})
