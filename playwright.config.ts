import { defineConfig, devices } from '@playwright/test'
import 'dotenv/config'
const evidenceDir = process.env.EVIDENCE_DIR || 'docs/evolucao/evidencias'

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
        outputFolder: `${evidenceDir}/playwright-report`,
        open: 'never',
      },
    ],
    ['json', { outputFile: `${evidenceDir}/playwright-results.json` }],
  ],
  outputDir: `${evidenceDir}/playwright-artifacts`,
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
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1440, height: 1000 },
      },
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command:
          'pnpm db:migrate && pnpm db:seed && pnpm exec concurrently -k -n api,web "pnpm exec tsx server/index.ts" "pnpm dev"',
        url: 'http://localhost:5174/api/health',
        reuseExistingServer: false,
        env: {
          DATABASE_URL: testDatabase,
          APP_ORIGIN: 'http://localhost:5174',
          API_PORT: '3002',
          VITE_PORT: '5174',
          BILLING_MODE: 'academic',
          REVIEW_MIN_DAYS: '0',
          JOBS_INTERVAL_MS: '1000',
        },
        stdout: 'pipe',
        stderr: 'pipe',
        timeout: 60_000,
      },
})
