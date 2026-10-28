"""Render actual LibreOffice-generated PDFs for visual inspection; requires PyMuPDF."""
import json
from pathlib import Path
import fitz

root = Path(__file__).resolve().parents[2] / 'docs' / 'evolucao'
out = root / 'evidencias' / 'documentos'
out.mkdir(parents=True, exist_ok=True)
report = []
for file in root.glob('*.pdf'):
    for generated in out.glob(f'{file.stem}-*.png'):
        if generated.is_file():
            generated.unlink()
    document = fitz.open(file)
    report.append({'document': file.name, 'pages': len(document), 'textChars': sum(len(p.get_text()) for p in document)})
    for number, page in enumerate(document, 1):
        page.get_pixmap(matrix=fitz.Matrix(.8, .8)).save(out / f'{file.stem}-{number}.png')
(out / 'render.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps(report, indent=2))
