import hashlib
import json
import re
import tempfile
from pathlib import Path

import fitz
from PIL import Image, ImageChops, ImageDraw

root = Path(__file__).resolve().parents[1]
source = root / 'docs/referencias/ERS-Sprint-1-original.pdf'
target = root / 'docs/evolucao/ERS-template-original-atualizada.pdf'
data = json.loads((root / 'docs/evolucao/template/atualizacoes.json').read_text(encoding='utf-8'))
original = fitz.open(source)
document = fitz.open(source)
font_paths = {
    'ArialMT': 'C:/Windows/Fonts/arial.ttf',
    'Arial-BoldMT': 'C:/Windows/Fonts/arialbd.ttf',
    'TimesNewRomanPSMT': 'C:/Windows/Fonts/times.ttf',
}
fonts = {name: fitz.Font(fontfile=file) for name, file in font_paths.items()}
allowed = {}
pending = []

def spans(page):
    return [s for b in page.get_text('dict')['blocks'] if 'lines' in b for line in b['lines'] for s in line['spans'] if s['text'].strip()]

def install(page, family):
    resource = 'Update' + family.replace('-', '')
    page.insert_font(fontname=resource, fontfile=font_paths[family])
    return resource

def rgb(value):
    return tuple(((value >> shift) & 255) / 255 for shift in (16, 8, 0))

def wrap(text, font, size, width):
    lines = []
    current = ''
    for word in text.split():
        candidate = (current + ' ' + word).strip()
        if font.text_length(candidate, fontsize=size) <= width:
            current = candidate
        else:
            if not current:
                raise ValueError('Word exceeds available width: ' + word)
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines

for patch in data:
    page = document[patch['page'] - 1]
    flat = spans(page)
    matches = [i for i, s in enumerate(flat) if patch['start'] in s['text']]
    if len(matches) != 1:
        raise ValueError(f"Ambiguous start on page {patch['page']}: {patch['start']} {matches}")
    first = matches[0]
    last = first
    if patch.get('end'):
        endings = [i for i in range(first, len(flat)) if patch['end'] in flat[i]['text']]
        if not endings:
            raise ValueError('End not found: ' + patch['end'])
        last = endings[0]
    selected = flat[first:last + 1]
    words = patch['text'].split()
    for offset, span in enumerate(selected):
        family = span['font']
        if family not in fonts:
            raise ValueError('Unexpected source font: ' + family)
        x, baseline = span['origin']
        next_index = first + offset + 1
        right = 550.0
        if next_index < len(flat):
            following = flat[next_index]
            if abs(following['origin'][1] - baseline) < 0.5 and next_index > last:
                right = following['bbox'][0] - 0.2
        line = ''
        while words:
            candidate = (line + ' ' + words[0]).strip()
            if fonts[family].text_length(candidate, fontsize=span['size']) > right - x:
                break
            line = candidate
            words.pop(0)
        rect = fitz.Rect(span['bbox'])
        rect.x0 += 0.1
        rect.x1 -= 0.1
        page.add_redact_annot(rect, fill=(1, 1, 1), cross_out=False)
        pending.append((patch['page'] - 1, (x, baseline), line, family, span['size'], span['color']))
        allowed.setdefault(patch['page'] - 1, []).append(fitz.Rect(x - 1, rect.y0 - 1, right + 1, rect.y1 + 1))
    if words:
        raise ValueError(f"Text does not fit on page {patch['page']}: {' '.join(words)}")

for number in allowed:
    document[number].apply_redactions(images=0, graphics=0)
for number, origin, text, family, size, color in pending:
    if text:
        page = document[number]
        page.insert_text(origin, text, fontname=install(page, family), fontsize=size, color=rgb(color))

history = document[2]
history_rows = [
    ('14/10/2026', '1.1', 'API, banco PostgreSQL, interface web e fluxo principal integrado.', 'Lucca Castilho Costa'),
    ('14/10/2026', '2.0', 'Mensagens, agenda, m\u00eddia, privacidade, financeiro e aplicativo.', 'Lucca Castilho Costa'),
    ('21/10/2026', '2.1', 'Revis\u00e3o t\u00e9cnica, modelos atualizados, APK integrado e evid\u00eancias de testes.', 'Lucca Castilho Costa'),
    ('23/10/2026', '2.2', 'Confer\u00eancia manual do CREF e atualiza\u00e7\u00e3o dos requisitos e fluxos.', 'Lucca Castilho Costa'),
    ('23/10/2026', '2.3', 'Escopo definido pela equipe e atualiza\u00e7\u00e3o desta c\u00f3pia no template original.', 'Lucca Castilho Costa'),
]
columns = [48.5, 132.5, 186.5, 420.5, 546.5]
for i, row in enumerate(history_rows):
    top = 322.5 + 44.25 * i
    for j, value in enumerate(row):
        family = 'Arial-BoldMT' if j == 0 else 'TimesNewRomanPSMT'
        for k, line in enumerate(wrap(value, fonts[family], 10, columns[j + 1] - columns[j] - 10)):
            if k >= 3:
                raise ValueError('History cell does not fit')
            history.insert_text((columns[j] + 5, top + 12 + k * 12), line, fontname=install(history, family), fontsize=10)
    allowed.setdefault(2, []).append(fitz.Rect(48, top, 548, top + 44.25))
for x in columns:
    history.draw_line((x, 499.5), (x, 543.75), color=(0, 0, 0), width=1)
history.draw_line((48, 543.75), (546.5, 543.75), color=(0, 0, 0), width=1)

bridge = document[46]
bridge.insert_text((54, 586), 'Atualiza\u00e7\u00e3o da Sprint 2: requisitos, regras, fluxos e evid\u00eancias', fontname=install(bridge, 'ArialMT'), fontsize=12)
bridge.insert_text((54, 606.7), 'consolidados nas p\u00e1ginas de continua\u00e7\u00e3o desta se\u00e7\u00e3o.', fontname=install(bridge, 'ArialMT'), fontsize=12)
bridge.insert_text((54, 627.4), 'Vers\u00e3o 2.3 - 23/10/2026. Escopo definido pela equipe.', fontname=install(bridge, 'ArialMT'), fontsize=12)
allowed.setdefault(46, []).append(fitz.Rect(53, 572, 551, 640))

appendix_page = None
cursor = 0.0

def new_page():
    global appendix_page, cursor
    appendix_page = document.new_page(width=596, height=842)
    header_rect = fitz.Rect(0, 0, 596, 60)
    header = original[46].get_pixmap(matrix=fitz.Matrix(2, 2), clip=header_rect, alpha=False)
    appendix_page.insert_image(header_rect, stream=header.tobytes('png'))
    heading = next(s for s in spans(original[46]) if s['text'].strip().startswith('7.'))
    appendix_page.insert_text((54, 84.5), '7. Ap\u00eandices - continua\u00e7\u00e3o', fontname=install(appendix_page, heading['font']), fontsize=heading['size'], color=rgb(heading['color']))
    cursor = 118.0

def paragraph(text, bold=False, gap=8):
    global cursor
    family = 'Arial-BoldMT' if bold else 'ArialMT'
    lines = wrap(text, fonts[family], 12, 496)
    if appendix_page is None or (bold and cursor + min(len(lines) + 2, 5) * 20.7 > 750):
        new_page()
    for line in lines:
        if cursor > 750:
            new_page()
        appendix_page.insert_text((54, cursor), line, fontname=install(appendix_page, family), fontsize=12)
        cursor += 20.7
    cursor += gap

def clean(text):
    text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', text)
    return text.replace('**', '').replace('`', '').replace('\u2192', ';').strip()

markdown = (root / 'docs/evolucao/ERS-v2.md').read_text(encoding='utf-8')
markdown = markdown[markdown.index('## Objetivo, atores e escopo'):]
section = 0
subsection = 0
table_header = None
for line in markdown.splitlines():
    if not line.strip():
        table_header = None
        continue
    if line.startswith('## '):
        section += 1
        subsection = 0
        paragraph(f'7.{section} ' + clean(line[3:]), True, 12)
    elif line.startswith('### '):
        subsection += 1
        paragraph(f'7.{section}.{subsection} ' + clean(line[4:]), True)
    elif line.startswith('|'):
        cells = [clean(c) for c in line.strip().strip('|').split('|')]
        if all(re.fullmatch(r':?-+:?', c) for c in cells):
            continue
        if table_header is None:
            table_header = cells
            continue
        paragraph(' - '.join(cells[:2]) if len(cells) == 4 else cells[0], True, 3)
        if len(cells) == 4:
            paragraph('Prioridade: ' + cells[2] + '. ' + cells[3])
        else:
            paragraph(' '.join(cells[1:]))
    else:
        paragraph(clean(line))

document.set_metadata({**original.metadata, 'title': 'LinkAtletas - ERS v2.3 - template original atualizado', 'subject': 'Sprint 2 - atualizacao do conteudo no template original'})
target.parent.mkdir(parents=True, exist_ok=True)
document.save(target, garbage=4, deflate=True)
document.close()
updated = fitz.open(target)
original_families = {s['font'] for page in original for s in spans(page)}
updated_families = {s['font'] for page in updated for s in spans(page)}
if updated_families - original_families:
    raise AssertionError('A new font family was introduced')
checks = []
preview = Path(tempfile.gettempdir()) / 'linkatletas-ers-template-review'
preview.mkdir(parents=True, exist_ok=True)
for number in range(len(original)):
    before = Image.frombytes('RGB', (596, 842), original[number].get_pixmap(alpha=False).samples)
    after = Image.frombytes('RGB', (596, 842), updated[number].get_pixmap(alpha=False).samples)
    for rect in allowed.get(number, []):
        box = (max(0, int(rect.x0) - 3), max(0, int(rect.y0) - 3), min(596, int(rect.x1) + 4), min(842, int(rect.y1) + 4))
        ImageDraw.Draw(before).rectangle(box, fill='white')
        ImageDraw.Draw(after).rectangle(box, fill='white')
    difference = ImageChops.difference(before, after).getbbox()
    checks.append({'page': number + 1, 'unchangedOutsideUpdates': difference is None, 'difference': difference})
    if difference:
        raise AssertionError(f'Unexpected visual difference on page {number + 1}: {difference}')
for number in [0, 2, 15, 27, 38, 46, 47, len(updated) - 1]:
    updated[number].get_pixmap(matrix=fitz.Matrix(1, 1)).save(preview / f'page-{number + 1}.png')
for start in range(0, len(updated), 12):
    sheet = Image.new('RGB', (1680, 1800), '#cccccc')
    for index, number in enumerate(range(start, min(start + 12, len(updated)))):
        pix = updated[number].get_pixmap(matrix=fitz.Matrix(0.65, 0.65), alpha=False)
        image = Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
        image.thumbnail((405, 565))
        x, y = (index % 4) * 420, (index // 4) * 600
        sheet.paste(image, (x, y + 25))
        ImageDraw.Draw(sheet).text((x + 10, y + 5), str(number + 1), fill='black')
    sheet.save(preview / f'overview-{start // 12 + 1}.png')
report = {
    'version': '2.3',
    'sourcePages': len(original),
    'updatedPages': len(updated),
    'patchedFields': len(data),
    'originalSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
    'updatedSha256': hashlib.sha256(target.read_bytes()).hexdigest(),
    'templateSectionsPreserved': True,
    'fontFamilies': sorted(set(font_paths)),
    'noNewFontFamilies': True,
    'bodyFontSize': 12,
    'historyFontSize': 10,
    'originalPagesVisualChecks': checks,
    'editableOriginalAvailable': False,
}
(root / 'docs/evolucao/evidencias/ers-template-verificacao.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps({k: v for k, v in report.items() if k != 'originalPagesVisualChecks'}, indent=2))
