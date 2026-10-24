import { chromium } from '@playwright/test'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'

const destination = path.resolve('docs/evolucao/template/figuras')
await mkdir(destination, { recursive: true })
const browser = await chromium.launch()
const manifest = []
try {
  for (const name of ['casos-de-uso', 'der']) {
    const source = await readFile(`docs/evolucao/diagramas/${name}.svg`, 'utf8')
    const box = source.match(/viewBox="([\d.]+) ([\d.]+) ([\d.]+) ([\d.]+)"/)
    if (!box) throw new Error('Missing SVG viewBox: ' + name)
    const width = Number(box[3])
    const height = Number(box[4])
    const page = await browser.newPage({ viewport: { width: Math.ceil(width), height: Math.ceil(height) } })
    await page.setContent('<html><head><style>html,body{margin:0;padding:0}svg{display:block}</style></head><body>' + source + '</body></html>')
    await page.evaluate(() => document.fonts.ready)
    await page.pdf({ path: path.join(destination, name + '.pdf'), width: width + 'px', height: height + 'px', printBackground: true, margin: { top: 0, left: 0, bottom: 0, right: 0 }, pageRanges: '1' })
    await page.close()
    const output = await readFile(path.join(destination, name + '.pdf'))
    manifest.push({ name, sourceSha256: createHash('sha256').update(source).digest('hex'), pdfSha256: createHash('sha256').update(output).digest('hex') })
    process.stdout.write(name + ': rendered\n')
  }
  await writeFile(path.join(destination, 'manifesto.json'), JSON.stringify(manifest, null, 2) + '\n')
} finally {
  await browser.close()
}
