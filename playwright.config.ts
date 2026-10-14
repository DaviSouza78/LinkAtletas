import { defineConfig, devices } from '@playwright/test'
import 'dotenv/config'

const testDatabase =
  process.env.TEST_DATABASE_URL ??
  'postgresql://linkatletas:linkatletas_dev@127.0.0.1:54329/linkatletas_test'
if (
  !decodeURIComponent(new URL(testDatabase).pathname.slice(1)).endsWith('_test')
) {
  throw new Error(
    'TEST_DATABASE_URL deve apontar para um banco com sufixo _test antes de aplicar migrations e seed.',
  )
}

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 10_000 },
  reporter: [
    ['list'],
    [
      'html',
      {
        outputFolder: 'docs/sprint-2/evidencias/playwright-report',
        open: 'never',
      },
    ],
    [
      'json',
      { outputFile: 'docs/sprint-2/evidencias/playwright-results.json' },
    ],
  ],
  outputDir: 'docs/sprint-2/evidencias/playwright-artifacts',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5174',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 20_000,
    viewport: { width: 1440, height: 1000 },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 1000 },
      },
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'pnpm db:migrate && pnpm db:seed && pnpm dev:all',
        url: 'http://localhost:5174',
        reuseExistingServer: false,
        env: {
          DATABASE_URL: testDatabase,
          APP_ORIGIN: 'http://localhost:5174',
          API_PORT: '3002',
          VITE_PORT: '5174',
        },
        stdout: 'pipe',
        stderr: 'pipe',
        timeout: 60_000,
      },
})
