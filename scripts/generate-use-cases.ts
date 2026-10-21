import { readFile, writeFile } from 'node:fs/promises'

const root = 'docs/evolucao/diagramas/'
const source = await readFile(root + 'casos-de-uso.puml', 'utf8')
const columns = [
  ['Conta', 'Descoberta', 'Financeiro', 'Execucao', 'Chat', 'Review', 'Agenda', 'Privacidade'],
  ['Credencial', 'Carteira', 'Prescricao', 'Correcao', 'Resposta', 'Moderacao', 'Encerrar', 'Taxa'],
]
const escape = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
const positions = new Map(columns.flatMap((items, column) => items.map((id, row) => [id, { x: 360 + column * 440, y: 150 + row * 105 }] as const)))
const actors: Record<string, { x: number; y: number; label: string }> = {
  Atleta: { x: 75, y: 320, label: 'Atleta' },
  Treinador: { x: 75, y: 675, label: 'Treinador' },
  Administrador: { x: 1135, y: 790, label: 'Administrador' },
  Servicos: { x: 1185, y: 250, label: 'SMTP / S3' },
  Gateway: { x: 1185, y: 465, label: 'Asaas' },
  Google: { x: 1185, y: 605, label: 'Google Agenda' },
}
const svg = [`<svg xmlns="http://www.w3.org/2000/svg" width="1340" height="1040" viewBox="0 0 1340 1040" role="img" aria-labelledby="title desc">
<title id="title">Casos de uso UML — LinkAtletas</title><desc id="desc">Gerado da fonte PlantUML, com dezesseis casos identificados e suas associações.</desc>
<rect width="1340" height="1040" fill="white"/>
<style>text{font-family:Arial,sans-serif;fill:#17362b}.assoc{stroke:#82948a;stroke-width:1;fill:none;opacity:.6}.actor{stroke:#284d3a;stroke-width:2.5;fill:none}.case{fill:#f4f8ed;stroke:#58734d;stroke-width:1.5}</style>
<text x="670" y="34" text-anchor="middle" font-size="22" font-weight="700">LinkAtletas — casos de uso UML</text>
<rect x="165" y="65" width="840" height="900" fill="none" stroke="#254736" stroke-width="2"/>
<text x="186" y="89" font-size="13">Sistema LinkAtletas · web e aplicativo, mesma API</text>`]
for (const actor of Object.values(actors)) {
  svg.push(`<g class="actor"><circle cx="${actor.x}" cy="${actor.y - 37}" r="14"/><path d="M${actor.x},${actor.y - 23}v43m-27,-30h54m-27,30l-23,33m23,-33l23,33"/></g><text x="${actor.x}" y="${actor.y + 74}" text-anchor="middle" font-size="14" font-weight="700">${actor.label}</text>`)
}
for (const match of source.matchAll(/^(\w+) -- (\w+)\s*$/gm)) {
  const actor = actors[match[1]], node = positions.get(match[2])
  if (!actor || !node) throw new Error('Associação UML desconhecida: ' + match[0])
  svg.push(`<path class="assoc" d="M${actor.x + (actor.x < 165 ? 28 : -28)},${actor.y} L${node.x + (actor.x < 165 ? -155 : 155)},${node.y}"/>`)
}
for (const match of source.matchAll(/usecase "([^"]+)" as (\w+)/g)) {
  const node = positions.get(match[2])
  if (!node) throw new Error('Posição UML ausente: ' + match[2])
  const [id, ...words] = match[1].split(' '), lines = words.join(' ').split('\\n')
  svg.push(`<ellipse class="case" cx="${node.x}" cy="${node.y}" rx="155" ry="38"/>`)
  lines.forEach((line, index) => svg.push(`<text x="${node.x}" y="${node.y - 13 + index * 15}" text-anchor="middle" font-size="12" font-weight="700">${escape(line)}</text>`))
  svg.push(`<text x="${node.x}" y="${node.y + 22}" text-anchor="middle" font-size="11">${id}</text>`)
}
svg.push('<text x="170" y="995" font-size="12">Atores secundários dependem de configuração; testes HTTP não comprovam sandbox real.</text><text x="170" y="1016" font-size="11">Fonte: casos-de-uso.puml · ERS v2.1 · 20/10/2026 · gerado por scripts/generate-use-cases.ts</text></svg>')
await writeFile(root + 'casos-de-uso.svg', svg.join('\n') + '\n')
