import argparse
import hashlib
import json
import re
import tempfile
from datetime import datetime, timezone, timedelta
from pathlib import Path

import fitz
from PIL import Image, ImageChops, ImageDraw

root = Path(__file__).resolve().parents[2]
base = root / 'docs/evolucao'
config = base / 'template'
source = root / 'docs/referencias/ERS-Sprint-1-original.pdf'
parser = argparse.ArgumentParser(description='Gerador historico da ERS v2.5; nao reproduz os ajustes manuais da ERS final.')
parser.add_argument('--output-dir', default=str(root / 'tmp/documentacao/ers-v2.5'))
args = parser.parse_args()
output = Path(args.output_dir).resolve()
output.mkdir(parents=True, exist_ok=True)
target = output / 'ERS-template-original-atualizada.pdf'
if target.resolve() == (base / target.name).resolve():
    raise ValueError('O gerador historico nao pode substituir a ERS oficial.')
settings = json.loads((config / 'secoes.json').read_text(encoding='utf-8'))
requirements = json.loads((config / 'requisitos.json').read_text(encoding='utf-8'))
tests = json.loads((config / 'testes.json').read_text(encoding='utf-8'))
assert {r['id'] for r in requirements} == {f'RF-{i:02}' for i in range(1, 25)} | {f'RF-A{i:02}' for i in range(1, 9)}
assert len({t['id'] for t in tests}) == len(tests) == 16
patches = json.loads((config / 'primeiras-paginas.json').read_text(encoding='utf-8'))
original = fitz.open(source)
document = fitz.open(source)
document.delete_pages(13, len(document) - 1)
font_paths = {
    'ArialMT': 'C:/Windows/Fonts/arial.ttf',
    'Arial-BoldMT': 'C:/Windows/Fonts/arialbd.ttf',
    'TimesNewRomanPSMT': 'C:/Windows/Fonts/times.ttf',
}
fonts = {name: fitz.Font(fontfile=file) for name, file in font_paths.items()}
allowed = {}
markdown = []
toc = []
layout = []
figures = []


def spans(page):
    return [s for b in page.get_text('dict')['blocks'] if 'lines' in b for line in b['lines'] for s in line['spans'] if s['text'].strip()]


def install(page, family):
    resource = 'Update' + family.replace('-', '')
    page.insert_font(fontname=resource, fontfile=font_paths[family])
    return resource


def wrap(text, family='ArialMT', size=12, width=496):
    lines = []
    current = ''
    for word in text.split():
        candidate = (current + ' ' + word).strip()
        if fonts[family].text_length(candidate, fontsize=size) <= width:
            current = candidate
        else:
            if not current:
                raise ValueError('Word exceeds available width: ' + word)
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


for patch in patches:
    page = document[patch['page'] - 1]
    flat = spans(page)
    matches = [i for i, s in enumerate(flat) if patch['start'] in s['text']]
    if len(matches) != 1:
        raise ValueError(f"Ambiguous start on page {patch['page']}: {patch['start']} {matches}")
    first = matches[0] - patch.get('includePrevious', 0)
    last = first
    if patch.get('end'):
        last = next(i for i in range(first, len(flat)) if patch['end'] in flat[i]['text'])
    selected = flat[first:last + 1]
    family = selected[0]['font']
    size = selected[0]['size']
    words = patch['text'].split()
    rows = {}
    for s in selected:
        rows.setdefault(round(s['origin'][1], 2), s['origin'][0])
        rect = fitz.Rect(s['bbox'])
        rect.x0 += 0.1
        rect.x1 -= 0.1
        page.add_redact_annot(rect, fill=(1, 1, 1), cross_out=False)
    pending = []
    for baseline, x in rows.items():
        right = 550
        leading = ' ' if not pending and selected[0]['text'].startswith(' ') else ''
        right -= fonts[family].text_length(leading, fontsize=size)
        if last + 1 < len(flat):
            following = flat[last + 1]
            if abs(following['origin'][1] - baseline) < 0.5:
                right = following['bbox'][0] - 0.2
        line = ''
        while words:
            candidate = (line + ' ' + words[0]).strip()
            if fonts[family].text_length(candidate, fontsize=size) > right - x:
                break
            line = candidate
            words.pop(0)
        pending.append(((x, baseline), leading + line if line else ''))
        allowed.setdefault(patch['page'] - 1, []).append(fitz.Rect(x - 2, baseline - size - 3, right + 2, baseline + 5))
    if words:
        raise ValueError(f"Text does not fit on page {patch['page']}: {' '.join(words)}")
    page.apply_redactions(images=0, graphics=0)
    for origin, text in pending:
        if text:
            page.insert_text(origin, text, fontname=install(page, family), fontsize=size, color=(0, 0, 0))

history = document[2]
columns = [48.5, 132.5, 186.5, 420.5, 546.5]
for i, row in enumerate(settings['history']):
    top = 322.5 + 44.25 * i
    for j, value in enumerate(row):
        family = 'Arial-BoldMT' if j == 0 else 'TimesNewRomanPSMT'
        lines = wrap(value, family, 10, columns[j + 1] - columns[j] - 10)
        assert len(lines) <= 3
        for k, line in enumerate(lines):
            history.insert_text((columns[j] + 5, top + 12 + k * 12), line, fontname=install(history, family), fontsize=10)
    allowed.setdefault(2, []).append(fitz.Rect(47, top - 1, 549, top + 45))
history_bottom = 322.5 + 44.25 * len(settings['history'])
for x in columns:
    history.draw_line((x, 499.5), (x, history_bottom), color=(0, 0, 0), width=1)
for y in [543.75 + 44.25 * i for i in range(len(settings['history']) - 4)]:
    history.draw_line((48.5, y), (546.5, y), color=(0, 0, 0), width=1)

page = None
cursor = 0
header_rect = fitz.Rect(0, 0, 596, 60)
header = original[46].get_pixmap(matrix=fitz.Matrix(2, 2), clip=header_rect, alpha=False).tobytes('png')


def new_page():
    global page, cursor
    page = document.new_page(width=596, height=842)
    page.insert_image(header_rect, stream=header)
    cursor = 82.7


def room(height):
    if page is None or cursor + height > 750:
        new_page()


def text_line(text, x, y, family, size):
    page.insert_text((x, y), text, fontname=install(page, family), fontsize=size, color=(0, 0, 0))
    layout.append({'page': page.number + 1, 'x': x, 'y': y, 'size': size, 'family': family, 'text': text})


def paragraph(text, bold=False, x=54, gap=5):
    global cursor
    family = 'Arial-BoldMT' if bold else 'ArialMT'
    lines = wrap(text, family, 12, 550 - x)
    room(min(len(lines), 3) * 20.7)
    for index, line in enumerate(lines):
        if cursor + (20.7 if index == len(lines) - 2 else 0) > 750:
            new_page()
        text_line(line, x, cursor, family, 12)
        cursor += 20.7
    cursor += gap
    markdown.append(text + '\n')


def heading(text, level=2, entry=True, fresh=False, before=0):
    global cursor
    if fresh and page is not None:
        new_page()
    elif before:
        room(before + 4 * 20.7)
        cursor += before
    size = 14 if level == 1 else 12
    lines = wrap(text, 'Arial-BoldMT', size, 496)
    room((len(lines) + 3) * 20.7)
    if entry:
        prefix = re.match(r'\d+(?:\.\d+)*', text)
        depth = len(prefix.group(0).split('.')) if prefix else level
        toc.append((text, page.number + 1, depth))
    for line in lines:
        text_line(line, 54, cursor, 'Arial-BoldMT', size)
        cursor += 20.7
    cursor += 8
    markdown.append('#' * (level + 1) + ' ' + text + '\n')


def field(key, value):
    global cursor
    label = settings['labels'].get(key, key)
    prefix = label + ': '
    if not value:
        room(65)
        paragraph(label + ':', True, 72, 0)
        return
    words = value.split()
    width = fonts['Arial-BoldMT'].text_length(prefix, fontsize=12)
    first = ''
    while words and width + fonts['ArialMT'].text_length((first + ' ' + words[0]).strip(), fontsize=12) <= 478:
        first = (first + ' ' + words.pop(0)).strip()
    rest = wrap(' '.join(words), width=460)
    room(min(1 + len(rest), 3) * 20.7)
    text_line(prefix, 72, cursor, 'Arial-BoldMT', 12)
    text_line(first, 72 + width, cursor, 'ArialMT', 12)
    cursor += 20.7
    for index, line in enumerate(rest):
        if cursor + (20.7 if index == len(rest) - 2 else 0) > 750:
            new_page()
        text_line(line, 90, cursor, 'ArialMT', 12)
        cursor += 20.7
    cursor += 5
    markdown.append('**' + label + ':** ' + value + '\n')


def sequence(steps):
    for i, value in enumerate(steps):
        paragraph(str(i + 1) + '. ' + value, x=90, gap=2)


def link(label, relative):
    start = len(layout)
    paragraph(label, gap=3)
    uri = relative if relative.startswith('https://') else 'https://github.com/DaviSouza78/LinkAtletas/blob/main/docs/evolucao/' + relative
    for line in layout[start:]:
        document[line['page'] - 1].insert_link({'kind': fitz.LINK_URI, 'from': fitz.Rect(line['x'], line['y'] - 12, 550, line['y'] + 4), 'uri': uri})
    markdown[-1] = '[' + label + '](' + relative + ')\n'


def figure(item):
    global cursor
    heading(item['title'], fresh=True)
    paragraph(item['caption'])
    path = base / item['file']
    if path.suffix == '.svg':
        rendered = config / 'figuras' / (path.stem + '.pdf')
        if not rendered.exists():
            raise ValueError('Run node scripts/documentacao/render-ers-figures.mjs first')
        manifest = json.loads((config / 'figuras/manifesto.json').read_text(encoding='utf-8'))
        recorded = next(row for row in manifest if row['name'] == path.stem)
        assert hashlib.sha256(path.read_bytes()).hexdigest() == recorded['sourceSha256']
        assert hashlib.sha256(rendered.read_bytes()).hexdigest() == recorded['pdfSha256']
        pdf = fitz.open(rendered)
        width, height = pdf[0].rect.width, pdf[0].rect.height
        scale = min(496 / width, (690 - cursor) / height)
        rect = fitz.Rect(54, cursor, 54 + width * scale, cursor + height * scale)
        page.show_pdf_page(rect, pdf, 0)
    else:
        image = Image.open(path)
        width, height = image.size
        scale = min(496 / width, (690 - cursor) / height)
        rect = fitz.Rect(54, cursor, 54 + width * scale, cursor + height * scale)
        page.insert_image(rect, filename=str(path))
    cursor = rect.y1 + 24
    link(item['file'], item['file'])
    figures.append({'file': item['file'], 'page': page.number + 1, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'rect': list(rect)})
    markdown.append('![' + item['title'] + '](' + item['file'] + ')\n')


markdown.append('# ERS v' + settings['version'] + ' - LinkAtletas\n')
markdown.append('Data: ' + settings['date'] + '. Fonte textual das se\u00e7\u00f5es repaginadas do PDF; capa, identifica\u00e7\u00e3o, hist\u00f3rico e se\u00e7\u00f5es iniciais s\u00e3o preservados do template e corrigidos pelos campos versionados.\n')
for value in settings['glossary']:
    if page is None:
        new_page()
        glossary = fitz.open()
        glossary.insert_pdf(original, from_page=13, to_page=13)
        glossary_page = glossary[0]
        glossary_page.add_redact_annot(fitz.Rect(0, 180, 596, 842), fill=(1, 1, 1), cross_out=False)
        glossary_page.add_redact_annot(fitz.Rect(360.8, 104, 545, 118), fill=(1, 1, 1), cross_out=False)
        glossary_page.add_redact_annot(fitz.Rect(256, 121, 545, 136), fill=(1, 1, 1), cross_out=False)
        glossary_page.apply_redactions(images=0, graphics=0)
        glossary_page.insert_font(fontname='GlossaryArialMT', fontfile=font_paths['ArialMT'])
        glossary_page.insert_text((360.95, 114.73), ' (interface compat\u00edvel;', fontname='GlossaryArialMT', fontsize=10)
        glossary_page.insert_text((256.5, 131.98), 'uso local ou remoto para arquivos privados).', fontname='GlossaryArialMT', fontsize=10)
        clip = fitz.Rect(54, 68, 550, 175)
        page.show_pdf_page(clip, glossary, 0, clip=clip)
        cursor = 200
    paragraph(value)
heading(settings['elicitationTitle'])
for value in settings['elicitation']:
    paragraph(value)
heading(settings['requirementsTitle'], 1, fresh=True)
heading(settings['functionalTitle'])
paragraph(settings['functionalIntro'])
for item in requirements:
    heading(item['id'] + ' - ' + item['name'], entry=False)
    field('priority', item['priority'] + '. ' + settings['labels']['status'] + ': ' + item['status'])
    for key in ['description', 'actor', 'pre']:
        field(key, item[key])
    field('steps', '')
    sequence(item['steps'])
    for key in ['alternative', 'acceptance']:
        field(key, item[key])

current = (base / 'requisitos/ERS-v2.md').read_text(encoding='utf-8')


def table_rows(prefix):
    return [[c.strip() for c in line.strip().strip('|').split('|')] for line in current.splitlines() if line.startswith('| ' + prefix)]


nonfunctional = table_rows('RNF-')
rules = table_rows('RN-')
assert len(requirements) == 32 and len(nonfunctional) == 16 and len(rules) == 16
heading(settings['nonfunctionalTitle'], fresh=True)
paragraph(settings['nonfunctionalIntro'])
for row in nonfunctional:
    heading(row[0], entry=False)
    field('criterion', row[1])
    field('limit', row[2])
heading(settings['rulesTitle'], fresh=True)
for row in rules:
    heading(row[0], entry=False)
    paragraph(row[1])
heading(settings['scheduleTitle'], 1, fresh=True)
heading(settings['scheduleSubtitle'])
for value in settings['schedule']:
    paragraph(value)
link('Backlog versionado', 'requisitos/backlog.md')
link('Roteiro dos professores', 'https://github.com/DaviSouza78/LinkAtletas/blob/main/docs/referencias/Roteiro-professores-original.pdf')
heading(settings['prototypeTitle'], 1, fresh=True)
paragraph(settings['prototypeIntro'])
link('Stitch - concep\u00e7\u00e3o hist\u00f3rica do atleta', 'https://stitch.withgoogle.com/projects/8385490830921443646?pli=1')
link('Stitch - concep\u00e7\u00e3o hist\u00f3rica do treinador', 'https://stitch.withgoogle.com/projects/17299066006957473062')
for item in settings['prototypes']:
    figure(item)
heading(settings['umlTitle'], 1, fresh=True)
paragraph(settings['umlIntro'])
for index, item in enumerate(settings['figures']):
    if index == 2:
        heading(settings['sequenceTitle'])
    figure(item)
heading(settings['testsTitle'], 1, fresh=True)
for value in settings['testsIntro']:
    paragraph(value)
vitest = json.loads((base / 'evidencias/vitest-results.json').read_text(encoding='utf-8'))
apk = json.loads((base / 'evidencias/android-integrated-result.json').read_text(encoding='utf-8'))
test_date = datetime.fromtimestamp(vitest['startTime'] / 1000, timezone(timedelta(hours=-3))).strftime('%d/%m/%Y %H:%M:%S UTC-03:00')
validated = []
for item in tests:
    if item['kind'] == 'apk':
        assertions = [s for s in apk['steps'] if s['name'] == item['assertion'] and s['passed']]
        environment = settings['apkEnvironment']
    else:
        assertions = [s for f in vitest['testResults'] for s in f['assertionResults'] if s['title'] == item['assertion'] and s['status'] == 'passed']
        environment = test_date + '. ' + settings['apiEnvironment']
    assert len(assertions) == 1, item['id']
    heading(item['id'] + ' - ' + item['name'], entry=False, before=20.7)
    field('refs', item['refs'])
    field('pre', item['pre'])
    field('steps', '')
    sequence(item['steps'])
    field('expected', item['expected'])
    field('observed', settings['passed'] + item['assertion'] + '.')
    field('environment', environment)
    link(item['file'], item['file'])
    validated.append({'id': item['id'], 'assertion': item['assertion'], 'source': item['file'], 'matchedPassedAssertion': True})
heading(settings['appendixTitle'], 1, before=32)
paragraph(settings['appendixText'])

initial_toc = [
    ('1 Introdu\u00e7\u00e3o', 5, 1),
    ('1.1 Objetivos deste documento', 6, 2),
    ('1.2 Escopo do produto', 6, 2),
    ('1.2.1 Nome do produto e componentes principais', 6, 3),
    ('1.2.2 Descri\u00e7\u00e3o do produto', 7, 3),
    ('1.2.3 Miss\u00e3o do produto', 8, 3),
    ('1.2.4 Tabela de viabilidade', 8, 3),
    ('1.2.5 Justificativa', 11, 3),
    ('1.3 Defini\u00e7\u00f5es e siglas', 13, 2),
]
toc = initial_toc + toc
toc_page = document[3]
toc_page.add_redact_annot(fitz.Rect(48, 110, 554, 790), fill=(1, 1, 1), cross_out=False)
toc_page.apply_redactions(images=0, graphics=0)
allowed[3] = [fitz.Rect(47, 109, 555, 791)]
y = 135
assert len(toc) <= 35
for title, number, level in toc:
    x = 54 if level == 1 else 72 if level == 2 else 90
    assert fonts['ArialMT'].text_length(title, fontsize=12) < 520 - x, title
    toc_page.insert_text((x, y), title, fontname=install(toc_page, 'ArialMT'), fontsize=12)
    label = str(number)
    right = 550 - fonts['ArialMT'].text_length(label, fontsize=12)
    toc_page.insert_text((right, y), label, fontname=install(toc_page, 'ArialMT'), fontsize=12)
    toc_page.insert_link({'kind': fitz.LINK_GOTO, 'from': fitz.Rect(x, y - 12, 550, y + 3), 'page': number - 1, 'to': fitz.Point(54, 75)})
    y += 17.4
toc_page.insert_text((54, y + 15), 'P\u00e1ginas: posi\u00e7\u00e3o f\u00edsica no PDF, incluindo a capa.', fontname=install(toc_page, 'ArialMT'), fontsize=12)
document.set_toc([[level, title, number] for title, number, level in toc])
document.set_metadata({**original.metadata, 'title': 'LinkAtletas - ERS v' + settings['version'] + ' - template original atualizado', 'subject': 'Sprint 2 - requisitos integrados e auditoria aplicada', 'modDate': fitz.get_pdf_now()})
fixed_cmaps = set()
for current_page in document:
    for font in current_page.get_fonts(full=True):
        if not font[4].startswith(('Update', 'Glossary')):
            continue
        kind, reference = document.xref_get_key(font[0], 'ToUnicode')
        if kind != 'xref':
            continue
        xref = int(reference.split()[0])
        if xref in fixed_cmaps:
            continue
        stream = document.xref_stream(xref)
        for old, new in [(b'00a0', b'0020'), (b'00ad', b'002d'), (b'037e', b'003b')]:
            stream = re.sub(rb'(?m)^(<[0-9a-f]+>\s+)<' + old + rb'>$', lambda m: m.group(1) + b'<' + new + b'>', stream)
        document.update_stream(xref, stream)
        fixed_cmaps.add(xref)
document.save(target, garbage=4, deflate=True)
document.close()
updated = fitz.open(target)
checks = []
preview = Path(tempfile.gettempdir()) / 'linkatletas-ers-template-review'
preview.mkdir(parents=True, exist_ok=True)
for number in range(13):
    before = Image.frombytes('RGB', (596, 842), original[number].get_pixmap(alpha=False).samples)
    after = Image.frombytes('RGB', (596, 842), updated[number].get_pixmap(alpha=False).samples)
    for rect in allowed.get(number, []):
        box = (max(0, int(rect.x0) - 3), max(0, int(rect.y0) - 3), min(596, int(rect.x1) + 4), min(842, int(rect.y1) + 4))
        ImageDraw.Draw(before).rectangle(box, fill='white')
        ImageDraw.Draw(after).rectangle(box, fill='white')
    difference = ImageChops.difference(before, after).getbbox()
    checks.append({'page': number + 1, 'unchangedOutsideUpdates': difference is None, 'difference': difference})
    assert difference is None, (number + 1, difference)
for start in range(0, len(updated), 12):
    sheet = Image.new('RGB', (1680, 1800), '#cccccc')
    for index, number in enumerate(range(start, min(start + 12, len(updated)))):
        pix = updated[number].get_pixmap(matrix=fitz.Matrix(0.65, 0.65), alpha=False)
        image = Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
        image.thumbnail((405, 565))
        x, y = (index % 4) * 420, (index // 4) * 600
        sheet.paste(image, (x, y + 25))
        ImageDraw.Draw(sheet).text((x + 10, y + 5), str(number + 1), fill='black')
        updated[number].get_pixmap(matrix=fitz.Matrix(1.5, 1.5), alpha=False).save(preview / f'page-{number + 1}.png')
    sheet.save(preview / f'overview-{start // 12 + 1}.png')
all_text = '\n'.join(p.get_text(sort=True) for p in updated)
assert '7. Ap\u00eandices - continua\u00e7\u00e3o' not in all_text
for title, number, level in toc:
    if number >= 14:
        assert title in updated[number - 1].get_text(), title
for line in layout:
    assert line['x'] >= 54 and 82 <= line['y'] <= 750
    assert fonts[line['family']].text_length(line['text'], fontsize=line['size']) <= 550 - line['x'] + 0.1
    assert line['size'] in [12, 14]
    assert line['text'] in updated[line['page'] - 1].get_text(), line
report = {
    'version': settings['version'],
    'documentReviewDate': settings['date'],
    'sourcePages': len(original),
    'updatedPages': len(updated),
    'originalSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
    'updatedSha256': hashlib.sha256(target.read_bytes()).hexdigest(),
    'preservedInitialPages': 13,
    'initialPagesVisualChecks': checks,
    'templateSectionsPreserved': True,
    'repaginatedBodyFontFamilies': ['ArialMT', 'Arial-BoldMT'],
    'bodyFontSize': 12,
    'mainHeadingFontSize': 14,
    'historyFontSize': 10,
    'fontReductionApplied': False,
    'functionalRequirementIds': [r['id'] for r in requirements],
    'nonfunctionalCount': len(nonfunctional),
    'businessRulesCount': len(rules),
    'testCasesMatchedToPassedEvidence': validated,
    'testExecutionRepeatedForDocumentRevision': False,
    'toc': [{'title': title, 'page': number} for title, number, level in toc],
    'figures': figures,
    'bodyLinesChecked': len(layout),
    'allBodyTextWithinMargins': True,
    'editableOriginalAvailable': False,
    'visualReview': 'pending inspection of rendered pages',
}
(output / 'ers-template-verificacao.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(output / 'ERS-template-original.md').write_text('\n'.join(markdown), encoding='utf-8')
print(json.dumps({'pages': len(updated), 'tocEntries': len(toc), 'bodyLines': len(layout), 'testCasesMatched': len(validated), 'preview': str(preview)}, indent=2))
