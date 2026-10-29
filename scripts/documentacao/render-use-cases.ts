import { chromium } from '@playwright/test'
import { pathToFileURL } from 'node:url'
import path from 'node:path'
const browser = await chromium.launch()
try {
  const page = await browser.newPage({
    viewport: { width: 1500, height: 1200 },
    deviceScaleFactor: 1,
  })
  await page.goto(
    pathToFileURL(path.resolve('docs/diagramas/casos-de-uso.svg'))
      .href,
  )
  await page
    .locator('svg')
    .screenshot({ path: 'docs/diagramas/casos-de-uso.png' })
} finally {
  await browser.close()
}
