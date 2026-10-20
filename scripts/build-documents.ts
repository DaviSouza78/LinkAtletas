import { readFile, writeFile, mkdir } from 'node:fs/promises'
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  WidthType,
  BorderStyle,
  Footer,
  PageNumber,
  AlignmentType,
  LevelFormat,
  ExternalHyperlink,
} from 'docx'
import path from 'node:path'

const root = 'docs/evolucao',
  width = 9638
const plainText = (text: string) =>
  text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)').replace(/\*\*|`/g, '')
const clean = (text: string) => plainText(text).trim()
function runs(text: string): Array<TextRun | ExternalHyperlink> {
  const output: Array<TextRun | ExternalHyperlink> = []
  for (const fragment of text.split(
    /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g,
  )) {
    const link = fragment.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (link && /^https?:/.test(link[2]))
      output.push(
        new ExternalHyperlink({
          link: link[2],
          children: [new TextRun({ text: link[1], style: 'Hyperlink' })],
        }),
      )
    else
      output.push(
        new TextRun({
          text: plainText(fragment),
          bold: fragment.startsWith('**'),
          ...(fragment.startsWith('`')
            ? { font: 'Courier New', size: 18 }
            : {}),
        }),
      )
  }
  return output
}
function parse(markdown: string) {
  const children: Array<Paragraph | Table> = [],
    lines = markdown.trimEnd().split(/\r?\n/)
  let code = false
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith('```')) {
      code = !code
      continue
    }
    if (!line.trim()) {
      children.push(new Paragraph({ spacing: { after: 50 } }))
      continue
    }
    if (code) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: line, font: 'Courier New', size: 17 }),
          ],
          spacing: { after: 20 },
        }),
      )
      continue
    }
    if (line.startsWith('|')) {
      const matrix: string[][] = []
      while (i < lines.length && lines[i].startsWith('|')) {
        const cells = lines[i]
          .trim()
          .slice(1, -1)
          .split(/(?<!\\)\|/)
          .map(clean)
        if (!cells.every((c) => /^:?-+:?$/.test(c))) matrix.push(cells)
        i++
      }
      i--
      const count = Math.max(...matrix.map((row) => row.length)),
        columnWidths =
          count === 4
            ? [900, 2200, 1000, 5538]
            : Array.from(
                { length: count },
                (_, j) =>
                  Math.floor(width / count) +
                  (j === count - 1 ? width % count : 0),
              )
      children.push(
        new Table({
          width: { size: width, type: WidthType.DXA },
          columnWidths,
          rows: matrix.map(
            (row, index) =>
              new TableRow({
                tableHeader: index === 0,
                cantSplit: true,
                children: columnWidths.map(
                  (cellWidth, j) =>
                    new TableCell({
                      width: { size: cellWidth, type: WidthType.DXA },
                      margins: { top: 80, bottom: 80, left: 100, right: 100 },
                      borders: Object.fromEntries(
                        ['top', 'bottom', 'left', 'right'].map((side) => [
                          side,
                          {
                            style: BorderStyle.SINGLE,
                            size: 1,
                            color: 'D2DCD6',
                          },
                        ]),
                      ),
                      shading: { fill: index === 0 ? 'EAF2EC' : 'FFFFFF' },
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: row[j] || '',
                              size: count > 3 ? 17 : 20,
                              bold: index === 0,
                            }),
                          ],
                          spacing: { after: 40 },
                        }),
                      ],
                    }),
                ),
              }),
          ),
        }),
      )
      continue
    }
    const heading = line.match(/^(#{1,3}) (.*)/)
    if (heading) {
      children.push(
        new Paragraph({
          heading:
            heading[1].length === 1
              ? HeadingLevel.TITLE
              : heading[1].length === 2
                ? HeadingLevel.HEADING_1
                : HeadingLevel.HEADING_2,
          children: runs(heading[2]),
          keepNext: true,
        }),
      )
      continue
    }
    const bullet = line.match(/^[-*] (.*)/)
    children.push(
      new Paragraph({
        children: runs((bullet?.[1] || line).replace(/^> /, '')),
        ...(bullet ? { numbering: { reference: 'bullets', level: 0 } } : {}),
        spacing: { after: 100, line: 260 },
        widowControl: true,
      }),
    )
  }
  return children
}
await mkdir(root, { recursive: true })
for (const name of ['ERS-v2', 'relatorio-testes']) {
  const source = await readFile(path.join(root, `${name}.md`), 'utf8')
  const doc = new Document({
    creator: 'Lucca',
    title:
      name === 'ERS-v2'
        ? 'LinkAtletas — Especificação de Requisitos v2'
        : 'LinkAtletas — Relatório de testes',
    description: 'Fonte Markdown versionada junto ao documento.',
    styles: {
      default: {
        document: { run: { font: 'Arial', size: 22, color: '172D24' } },
      },
      paragraphStyles: [
        {
          id: 'Title',
          name: 'Title',
          basedOn: 'Normal',
          run: { font: 'Arial', size: 38, bold: true, color: '112D22' },
          paragraph: { spacing: { before: 120, after: 300 } },
        },
        {
          id: 'Heading1',
          name: 'Heading 1',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { font: 'Arial', size: 29, bold: true, color: '173D2B' },
          paragraph: {
            outlineLevel: 0,
            spacing: { before: 300, after: 160 },
            keepNext: true,
          },
        },
        {
          id: 'Heading2',
          name: 'Heading 2',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { font: 'Arial', size: 24, bold: true },
          paragraph: {
            outlineLevel: 1,
            spacing: { before: 220, after: 120 },
            keepNext: true,
          },
        },
      ],
    },
    numbering: {
      config: [
        {
          reference: 'bullets',
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: '•',
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 360, hanging: 180 } } },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'LinkAtletas · 20/10/2026     ',
                    size: 17,
                    color: '5F7168',
                  }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 17 }),
                ],
              }),
            ],
          }),
        },
        children: parse(source),
      },
    ],
  })
  await writeFile(path.join(root, `${name}.docx`), await Packer.toBuffer(doc))
  console.log(`${name}.docx criado a partir da fonte Markdown.`)
}
