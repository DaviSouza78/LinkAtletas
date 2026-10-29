import argparse
import hashlib
import io
import json
import re
import zipfile
from copy import deepcopy
from datetime import datetime, timedelta, timezone
from pathlib import Path

import fitz
from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK, WD_TAB_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Pt, RGBColor
from PIL import Image

root = Path(__file__).resolve().parents[2]
base = root / 'docs'
config = base / 'template'
parser = argparse.ArgumentParser()
parser.add_argument('--reference', required=True)
parser.add_argument('--page-map')
args = parser.parse_args()
reference = Path(args.reference)
if reference.resolve() == (base / 'ERS-template-original-atualizada.docx').resolve():
    raise ValueError('A referencia deve ser diferente do documento de saida.')
document = Document(reference)
settings = json.loads((config / 'revisao-modelo.json').read_text(encoding='utf-8'))
previous = json.loads((config / 'secoes.json').read_text(encoding='utf-8'))
requirements = json.loads((config / 'requisitos.json').read_text(encoding='utf-8'))
nonfunctional = json.loads((config / 'nao-funcionais.json').read_text(encoding='utf-8'))
tests = json.loads((config / 'testes.json').read_text(encoding='utf-8'))
original = fitz.open(root / 'docs/referencias/ERS-Sprint-1-original.pdf')
page_map = json.loads(Path(args.page_map).read_text(encoding='utf-8')) if args.page_map else {}
assert len(requirements) == 32 and len(nonfunctional) == 16 and len(tests) == 16
assert len(settings['sequences']) == 6 and len(settings['activities']) == 2
source_hash = hashlib.sha256(reference.read_bytes()).hexdigest()
assets = config / 'originais'
assets.mkdir(exist_ok=True)
body = document._element.body
paragraphs = document.paragraphs
cut = next(p for p in paragraphs if p.text.startswith('T\u00e9cnica(s) utilizada(s)'))
last_section = deepcopy(document.sections[13]._sectPr)
preserved = []
for p in paragraphs:
    if p._p is cut._p:
        break
    preserved.append(p)
for p in preserved:
    names = {
        'Jo\u00e3o Gabriel Floriano Olimpio Davi Marcondes Paes de Souza Lucas Souza da Silva': 'Jo\u00e3o Gabriel Floriano Olimpio\nDavi Marcondes Paes de Souza\nLucas Souza da Silva',
        'Lucca Castilho Costa Miguel Oliveira de Almeida': 'Lucca Castilho Costa\nMiguel Oliveira de Almeida',
        'Jo\u00e3o Pedro Fonseca Carvalho Prof.\u00ba Wesley Fioreze': 'Jo\u00e3o Pedro Fonseca Carvalho\nProf.\u00ba Wesley Fioreze',
    }
    if p.text in names:
        value = names[p.text]
        p.runs[0].text = value
        for run in p.runs[1:]:
            run.text = ''
        p.paragraph_format.left_indent -= Pt(20)
        p.paragraph_format.right_indent -= Pt(20)
    if p.text == 'Vers\u00e3o <2.5>':
        for run in p.runs:
            if '2.5' in run.text:
                run.text = run.text.replace('2.5', settings['version'])
    for prefix, replacement in settings['cloudReplacements']:
        if p.text.startswith(prefix):
            first = p.runs[0] if p.runs else p.add_run()
            first.text = replacement
            for run in p.runs[1:]:
                run.text = ''
for child in list(body)[list(body).index(cut._p):]:
    body.remove(child)
body.append(last_section)
history = document.tables[0]
history._tbl.append(deepcopy(history.rows[-1]._tr))
for cell, value in zip(history.rows[-1].cells, settings['history']):
    p = cell.paragraphs[0]
    p.runs[0].text = value
    for run in p.runs[1:]:
        run.text = ''
    for other in cell.paragraphs[1:]:
        other._p.getparent().remove(other._p)

toc_title = next(p for p in document.paragraphs if p.text == 'Sum\u00e1rio')
toc_end = toc_title._p.getnext()
while toc_end is not None and toc_end.find('.//' + qn('w:sectPr')) is None:
    following = toc_end.getnext()
    body.remove(toc_end)
    toc_end = following
assert toc_end is not None
entries = [
    ('1 Introdu\u00e7\u00e3o', 'intro', 5),
    ('1.1 Objetivos deste documento', 'objetivos', 6),
    ('1.2 Escopo do produto', 'escopo', 6),
    ('1.2.1 Nome do produto e componentes principais', 'componentes', 6),
    ('1.2.2 Descri\u00e7\u00e3o do produto', 'produto', 7),
    ('1.2.3 Miss\u00e3o do produto', 'missao', 8),
    ('1.2.4 Tabela de viabilidade', 'viabilidade', 8),
    ('1.2.5 Justificativa', 'justificativa', 11),
    ('1.3 Defini\u00e7\u00f5es e siglas', 'siglas', 13),
    ('1.4 T\u00e9cnica(s) utilizada(s) para levantamento de requisitos', 'tecnicas', 14),
    ('2. Requisitos Espec\u00edficos', 'requisitos', 15),
    ('2.1 Requisitos Funcionais (RF)', 'funcionais', 15),
    ('2.2 Requisitos N\u00e3o Funcionais (RNF)', 'nao_funcionais', 32),
    ('2.3 Regras de Neg\u00f3cio (RN)', 'regras', 42),
    ('3. Cronograma do Projeto', 'cronograma', 44),
    ('3.1 Planejamento de Sprints', 'sprints', 44),
    ('4. Prot\u00f3tipo do produto', 'prototipos', 48),
    ('5. Diagramas UML', 'uml', 52),
    ('5.1 Diagrama de Casos de Uso', 'casos_uso', 52),
    ('5.1 Diagrama de Classes', 'classes', 53),
    ('5.2 Diagrama de Sequ\u00eancia', 'sequencias', 54),
    ('5.3 Diagrama de Atividade', 'atividades', 60),
    ('5.4 DER', 'der', 62),
    ('6. Casos de Testes', 'testes', 63),
    ('7. Ap\u00eandices', 'apendices', 70),
]
created_headings = []
markdown = ['# ERS v' + settings['version'] + ' - LinkAtletas\n']


def tc(p, key):
    title = next(row[0] for row in entries if row[1] == key)
    run = p.add_run()
    run.font.hidden = True
    begin = OxmlElement('w:fldChar')
    begin.set(qn('w:fldCharType'), 'begin')
    instruction = OxmlElement('w:instrText')
    instruction.set(qn('xml:space'), 'preserve')
    instruction.text = ' TC "' + title + '" \\f E \\l 1 '
    end = OxmlElement('w:fldChar')
    end.set(qn('w:fldCharType'), 'end')
    run._r.extend([begin, instruction, end])


initial_names = ['Introdu\u00e7\u00e3o', 'Objetivos deste documento', 'Escopo do produto', 'Nome do produto e de seus componentes principais', 'Descri\u00e7\u00e3o do produto', 'Miss\u00e3o do produto', 'Tabela de viabilidade', 'Justificativa', 'Defini\u00e7\u00f5es e siglas']
for index, name in enumerate(initial_names):
    p = next(p for p in preserved if p.text == name)
    key = entries[index][1]
    start = OxmlElement('w:bookmarkStart')
    start.set(qn('w:id'), str(100 + index))
    start.set(qn('w:name'), 'ers_' + key)
    end = OxmlElement('w:bookmarkEnd')
    end.set(qn('w:id'), str(100 + index))
    p._p.insert(1, start)
    p._p.append(end)
    tc(p, key)


def font(run, size=12, bold=False):
    run.font.name = 'Arial'
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = RGBColor(0, 0, 0)
    rfonts = run._r.get_or_add_rPr().get_or_add_rFonts()
    for name in ['ascii', 'hAnsi', 'eastAsia', 'cs']:
        rfonts.set(qn('w:' + name), 'Arial')


def paragraph(text='', bold=False, before=0, after=5, left=11.5, hanging=0, keep=False):
    p = document.add_paragraph(style='Normal')
    f = p.paragraph_format
    f.left_indent = Pt(left)
    f.right_indent = Pt(3.5)
    f.first_line_indent = Pt(hanging)
    f.line_spacing = Pt(20.7)
    f.space_before = Pt(before)
    f.space_after = Pt(after)
    f.keep_with_next = keep
    f.keep_together = True
    f.widow_control = True
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    num = OxmlElement('w:numPr')
    number = OxmlElement('w:numId')
    number.set(qn('w:val'), '0')
    num.append(number)
    p._p.get_or_add_pPr().append(num)
    if text:
        font(p.add_run(text), bold=bold)
    markdown.append(text + '\n')
    return p


def heading(text, key=None, level=2, fresh=False):
    p = paragraph(text, True, before=14, after=8, keep=True)
    p.paragraph_format.page_break_before = fresh
    font(p.runs[0], 14 if level == 1 else 12, True)
    outline = OxmlElement('w:outlineLvl')
    outline.set(qn('w:val'), str(level - 1))
    p._p.get_or_add_pPr().append(outline)
    if key:
        bookmark = OxmlElement('w:bookmarkStart')
        bookmark.set(qn('w:id'), str(1000 + len(created_headings)))
        bookmark.set(qn('w:name'), 'ers_' + key)
        p._p.insert(1, bookmark)
        end = OxmlElement('w:bookmarkEnd')
        end.set(qn('w:id'), bookmark.get(qn('w:id')))
        p._p.append(end)
        created_headings.append({'key': key, 'text': text})
        tc(p, key)
    markdown[-1] = '#' * (level + 1) + ' ' + text + '\n'
    return p


def field(label, value='', bullet=True):
    p = paragraph(after=3, left=47.5, hanging=-18, keep=not value)
    if bullet:
        font(p.add_run('\u2022\t'))
        p.paragraph_format.tab_stops.add_tab_stop(Pt(47.5))
    font(p.add_run(label + ': '), bold=True)
    font(p.add_run(value))
    markdown[-1] = '**' + label + ':** ' + value + '\n'
    return p


def steps(values):
    for i, value in enumerate(values, 1):
        paragraph(str(i) + '.\t' + value, left=65.5, hanging=-18, after=2)


def alternative(values):
    for i, value in enumerate(values, 1):
        paragraph('A' + str(i) + ' - ' + value, left=47.5, after=3)


def hyperlink(label, uri):
    p = paragraph(after=4)
    node = OxmlElement('w:hyperlink')
    node.set(qn('r:id'), document.part.relate_to(uri, 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink', is_external=True))
    run = p.add_run(label)
    font(run)
    p._p.remove(run._r)
    node.append(run._r)
    p._p.append(node)
    markdown[-1] = '[' + label + '](' + uri + ')\n'


def picture(path, max_height=510):
    im = Image.open(path)
    ratio = min(496 / im.width, max_height / im.height)
    p = paragraph(after=8)
    p.paragraph_format.line_spacing = 1.0
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.add_run().add_picture(str(path), width=Pt(im.width * ratio), height=Pt(im.height * ratio))
    markdown[-1] = '![' + path.stem + '](' + path.relative_to(base).as_posix() + ')\n'


def extract(xref, name):
    path = assets / name
    data = original.extract_image(xref)
    im = Image.open(io.BytesIO(data['image']))
    im.save(path)
    return path


def illustration(item, conceptual=False, fresh=True):
    heading(item['title'], fresh=fresh)
    path = extract(item['xref'], item['asset']) if 'xref' in item else base / item['asset']
    picture(path, item.get('height', 510))
    if item.get('caption'):
        paragraph(item['caption'])
    if conceptual or 'xref' in item:
        paragraph('Fonte: Elabora\u00e7\u00e3o Pr\u00f3pria (2026).')


toc_paragraphs = []
for title, key, initial_page in entries:
    p = paragraph(title + '\t' + str(page_map.get(key, initial_page)), after=0)
    p.paragraph_format.line_spacing = Pt(17.4)
    p.paragraph_format.keep_together = True
    p.paragraph_format.tab_stops.add_tab_stop(Pt(495), WD_TAB_ALIGNMENT.RIGHT)
    internal = OxmlElement('w:hyperlink')
    internal.set(qn('w:anchor'), 'ers_' + key)
    run = p.runs[0]._r
    p._p.remove(run)
    internal.append(run)
    p._p.append(internal)
    body.remove(p._p)
    toc_end.addprevious(p._p)
    toc_paragraphs.append(p)
begin_run = toc_paragraphs[0].add_run()
begin = OxmlElement('w:fldChar')
begin.set(qn('w:fldCharType'), 'begin')
instruction = OxmlElement('w:instrText')
instruction.set(qn('xml:space'), 'preserve')
instruction.text = ' TOC \\f E \\h \\z '
separator = OxmlElement('w:fldChar')
separator.set(qn('w:fldCharType'), 'separate')
begin_run._r.extend([begin, instruction, separator])
toc_paragraphs[0]._p.remove(begin_run._r)
toc_paragraphs[0]._p.insert(1, begin_run._r)
end_run = toc_paragraphs[-1].add_run()
end = OxmlElement('w:fldChar')
end.set(qn('w:fldCharType'), 'end')
end_run._r.append(end)

heading(entries[9][0], 'tecnicas')
paragraph('As seguintes t\u00e9cnicas foram utilizadas:')
for value in settings['elicitation']:
    paragraph('\u2022\t' + value, left=47.5, hanging=-18, after=0)
heading('2. Requisitos Espec\u00edficos', 'requisitos', 1)
heading('2.1 Requisitos Funcionais (RF)', 'funcionais')
paragraph(settings['functionalIntro'])
paragraph('Os requisitos financeiros RF-11 a RF-13 e RF-24 possuem integra\u00e7\u00e3o preparada e testes controlados. A demonstra\u00e7\u00e3o acad\u00eamica n\u00e3o realiza cobran\u00e7as reais.')
for item in requirements:
    identifier = item['id'].replace('RF-', 'RF ')
    heading('[' + identifier + '] \u2013 ' + item['name'])
    field('Descri\u00e7\u00e3o', item['description'])
    field('Ator Principal', item['actor'])
    field('Pr\u00e9-condi\u00e7\u00f5es', item['pre'])
    field('Fluxo Principal')
    steps(item['steps'])
    field('Fluxos Alternativos / Subfluxos')
    values = item.get('alternatives') or re.split(r'(?<=[.!?])\s+', item['alternative'])
    alternative(values)
heading('2.2 Requisitos N\u00e3o Funcionais (RNF)', 'nao_funcionais')
paragraph('Os requisitos n\u00e3o funcionais definem qualidades e restri\u00e7\u00f5es t\u00e9cnicas. Os fluxos abaixo tamb\u00e9m orientam os cen\u00e1rios de verifica\u00e7\u00e3o; os resultados executados est\u00e3o na se\u00e7\u00e3o 6 e nos relat\u00f3rios de testes.')
for item in nonfunctional:
    heading('[' + item['id'] + '] \u2013 ' + item['name'])
    field('Descri\u00e7\u00e3o', item['description'])
    field('Ator Principal', item['actor'])
    field('Pr\u00e9-condi\u00e7\u00f5es', item['pre'])
    field('Fluxo Principal')
    steps(item['steps'])
    field('Fluxos Alternativos / Subfluxos')
    alternative(item['alternatives'])
heading('2.3 Regras de Neg\u00f3cio (RN)', 'regras')
paragraph('As Regras de Neg\u00f3cio definem as restri\u00e7\u00f5es l\u00f3gicas e os processos que o software deve obedecer obrigatoriamente.', keep=True)
summary = (base / 'requisitos/ERS-v2.md').read_text(encoding='utf-8')
rules = [[c.strip() for c in line.strip().strip('|').split('|')] for line in summary.splitlines() if line.startswith('| RN-')]
assert len(rules) == 16
for row in rules:
    field(row[0], row[1])
heading('3. Cronograma do Projeto', 'cronograma', 1, True)
paragraph(settings['scheduleIntro'])
heading('3.1 Planejamento de Sprints', 'sprints')
paragraph(settings['scheduleMethod'])
for sprint in settings['sprints']:
    paragraph('\u2022 ' + sprint['title'], True, before=10, keep=True)
    for value in sprint['items']:
        paragraph('\u25cb\t' + value, left=47.5, hanging=-18, after=3)
heading('Cronograma visual do projeto', fresh=True)
picture(extract(108, 'cronograma-original.png'), 400)
paragraph('Fonte: Planejamento inicial do grupo (2026). As janelas de entrega atualizadas constam na se\u00e7\u00e3o 3.1; o quadro preserva a distribui\u00e7\u00e3o de atividades do planejamento original.')
schedule_url = next(item['uri'] for item in original[40].get_links() if item.get('uri', '').startswith('https://docs.google.com/spreadsheets/'))
hyperlink('Cronograma_Projeto_Integrador_LinkAtletas', schedule_url)
hyperlink('Backlog atualizado do projeto', 'https://github.com/DaviSouza78/LinkAtletas/blob/main/docs/requisitos/backlog.md')
heading('4. Prot\u00f3tipo do produto', 'prototipos', 1, True)
paragraph(settings['prototypeIntro'])
field('Link para o Prot\u00f3tipo')
hyperlink('Atleta \u2014 prot\u00f3tipo no Stitch', 'https://stitch.withgoogle.com/projects/8385490830921443646?pli=1')
hyperlink('Treinador \u2014 prot\u00f3tipo no Stitch', 'https://stitch.withgoogle.com/projects/17299066006957473062')
field('Principais Telas')
for item in settings['prototypes']:
    illustration(item)
heading('5. Diagramas UML', 'uml', 1, True)
for i, item in enumerate(settings['conceptual']):
    heading(item['title'], 'casos_uso' if i == 0 else 'classes', fresh=i != 0)
    picture(extract(item['xref'], item['asset']), 500 if i == 0 else item['height'])
    paragraph(item['caption'])
    paragraph('Fonte: Elabora\u00e7\u00e3o Pr\u00f3pria (2026).')
heading('5.2 Diagrama de Sequ\u00eancia', 'sequencias', fresh=True)
paragraph('Os seis diagramas detalham os processos da Sprint 2. As duas sequ\u00eancias de contrata\u00e7\u00e3o e treino mant\u00eam as vers\u00f5es atualizadas aprovadas pela equipe.')
for i, item in enumerate(settings['sequences']):
    illustration(item, fresh=i != 0)
heading('5.3 Diagrama de Atividade', 'atividades', fresh=True)
paragraph('Os diagramas apresentam as decis\u00f5es e os caminhos dos processos de valida\u00e7\u00e3o profissional e acompanhamento esportivo.')
for i, item in enumerate(settings['activities']):
    illustration(item, fresh=i != 0)
heading('5.4 DER', 'der', fresh=True)
schema = json.loads((base / 'evidencias/api/database-schema.json').read_text(encoding='utf-8'))
paragraph('O modelo representa as ' + str(len(schema['tables'])) + ' tabelas do esquema PostgreSQL exportado. O banco remoto utiliza Neon; o banco Docker \u00e9 independente. A figura apresenta atributos selecionados; os campos, \u00edndices e restri\u00e7\u00f5es completos est\u00e3o no dicion\u00e1rio de dados.')
picture(base / 'diagramas/der.png', 470)
hyperlink('DER vetorial ampli\u00e1vel', 'https://github.com/DaviSouza78/LinkAtletas/blob/main/docs/diagramas/der.svg')
hyperlink('Dicion\u00e1rio de dados e relacionamentos', 'https://github.com/DaviSouza78/LinkAtletas/blob/main/docs/banco/dicionario-dados.md')
heading('6. Casos de Testes', 'testes', 1, True)
for value in settings['testsIntro']:
    paragraph(value)
hyperlink('Relat\u00f3rio de testes e evid\u00eancias', 'https://github.com/DaviSouza78/LinkAtletas/blob/main/docs/relatorio-testes.md')
hyperlink('Implanta\u00e7\u00e3o e testes remotos de 26/10/2026', 'https://github.com/DaviSouza78/LinkAtletas/blob/main/docs/operacao/implantacao-2026-10-26.md')
vitest = json.loads((base / 'evidencias/vitest-results.json').read_text(encoding='utf-8'))
apk = json.loads((base / 'evidencias/android-integrated-result.json').read_text(encoding='utf-8'))
test_date = datetime.fromtimestamp(vitest['startTime'] / 1000, timezone(timedelta(hours=-3))).strftime('%d/%m/%Y %H:%M:%S UTC-03:00')
validated = []
for item in tests:
    first_paragraph = len(document.paragraphs)
    if item['kind'] == 'apk':
        assertions = [s for s in apk['steps'] if s['name'] == item['assertion'] and s['passed']]
        environment = previous['apkEnvironment']
    else:
        assertions = [s for f in vitest['testResults'] for s in f['assertionResults'] if s['title'] == item['assertion'] and s['status'] == 'passed']
        environment = test_date + '. ' + previous['apiEnvironment']
    assert len(assertions) == 1, item['id']
    heading(item['id'] + ' \u2013 ' + item['name'])
    field('Rastreabilidade', item['refs'], False)
    field('Pr\u00e9-condi\u00e7\u00f5es', item['pre'], False)
    field('Fluxo de Teste', bullet=False)
    steps(item['steps'])
    field('Resultado esperado', item['expected'], False)
    field('Resultado observado', 'Aprovado no registro preservado: ' + item['assertion'] + '.', False)
    field('Data e ambiente', environment, False)
    hyperlink('Evid\u00eancia ' + item['id'], 'https://github.com/DaviSouza78/LinkAtletas/blob/main/docs/' + item['file'])
    for p in document.paragraphs[first_paragraph:-1]:
        p.paragraph_format.keep_with_next = True
    validated.append({'id': item['id'], 'assertion': item['assertion'], 'file': item['file']})
heading('7. Ap\u00eandices', 'apendices', 1)
paragraph('N\u00e3o se aplica nesta entrega. A documenta\u00e7\u00e3o da API, o backlog e os relat\u00f3rios de testes s\u00e3o entregues como documentos de apoio separados.')
document.core_properties.title = 'LinkAtletas - ERS v' + settings['version']
document.core_properties.author = 'Equipe LinkAtletas'
document.core_properties.last_modified_by = 'Lucca'
output = base / 'ERS-template-original-atualizada.docx'
document.save(output)
preserve_names = ['word/styles.xml', 'word/stylesWithEffects.xml', 'word/numbering.xml', 'word/settings.xml', 'word/fontTable.xml', 'word/webSettings.xml']
with zipfile.ZipFile(reference) as source_zip, zipfile.ZipFile(output) as output_zip:
    preserved_parts = {name: source_zip.read(name) for name in source_zip.namelist() if name in preserve_names or name.startswith(('word/header', 'word/_rels/header', 'word/footer', 'word/_rels/footer', 'word/theme/'))}
    updated_parts = {name: output_zip.read(name) for name in output_zip.namelist()}
updated_parts.update(preserved_parts)
with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as output_zip:
    for name, data in updated_parts.items():
        output_zip.writestr(name, data)
assert hashlib.sha256(reference.read_bytes()).hexdigest() == source_hash
(config / 'cabecalhos-modelo.json').write_text(json.dumps(created_headings, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(base / 'requisitos/ERS-template-original.md').write_text('\n'.join(line.rstrip() for line in '\n'.join(markdown).splitlines()) + '\n', encoding='utf-8')
report = {'version': settings['version'], 'documentReviewDate': settings['date'], 'referenceSha256': source_hash, 'editableText': True, 'output': output.name, 'functionalRequirements': len(requirements), 'nonfunctionalRequirements': len(nonfunctional), 'businessRules': len(rules), 'sequences': len(settings['sequences']), 'activities': len(settings['activities']), 'testCasesMatchedToPassedEvidence': validated, 'visualReview': 'pending'}
(base / 'evidencias/documentacao/ers-modelo-verificacao.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'file': str(output), 'headings': len(created_headings), 'version': settings['version']}, indent=2))
