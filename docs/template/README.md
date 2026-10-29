# ERS no modelo do professor

Versão corrente: **2.6, de 26/10/2026**. Documento oficial: [PDF final ajustado pela equipe](../ERS-template-original-atualizada.pdf), fornecido e preservado sem conversão. O DOCX anterior foi retirado por não representar esses ajustes. Os arquivos desta pasta registram a geração anterior e não substituem o PDF final.

A revisão restaura o formato das fichas de requisitos, as técnicas de levantamento, o detalhamento do cronograma, os protótipos e os diagramas conceituais do grupo. Mantém CREF manual, implantação remota e testes rastreáveis. O [registro das correções](https://github.com/DaviSouza78/LinkAtletas/tree/094ed35704a4620eb358e217b7ee7b1c5cda22e0/docs/historico/revisoes-ers/revisao-ers-v2.6.md) explica as alterações e a numeração mantida conforme o modelo.

Preservam-se as fontes, cores, dimensões de página, cabeçalhos, capa, identificação e tabelas do documento fornecido, com correções localizadas de versão e implantação. O corpo segue Arial 12, títulos principais Arial 14 em negrito e campos em listas, conforme o documento original preenchido. O histórico mantém sua tipografia original e recebe a revisão 2.6. Não se reduz fonte para impor quantidade de páginas.

## Fontes

- [Modelo do professor](../referencias/Modelo-ERS-professor-2026.pdf): estrutura das seções e dos requisitos.
- [ERS da Sprint 1](../referencias/ERS-Sprint-1-original.pdf): conteúdo original, cronograma, protótipos e modelos conceituais.
- [Word fornecido para a revisão](../referencias/ERS-base-editavel-sprint-2.docx): base editável preservada.
- [revisao-modelo.json](revisao-modelo.json): revisão 2.6, técnicas, cronograma, figuras e atualizações de implantação.
- [requisitos.json](requisitos.json): requisitos funcionais e fluxos; prioridade, estado e aceite ficam disponíveis como metadados, sem criar campos extras na ficha do professor.
- [nao-funcionais.json](nao-funcionais.json): requisitos não funcionais com fluxos de verificação e limites reais.
- [testes.json](testes.json): CT001–CT016 e asserções correspondentes a registros aprovados.
- [originais](originais): imagens extraídas da ERS original sem redesenhar o trabalho do grupo.

## Reprodução

O gerador da revisão anterior aos ajustes manuais é [build-ers-template.py](../../scripts/documentacao/build-ers-template.py). Não reproduz automaticamente o PDF final fornecido pela equipe. Requer Python com python-docx, PyMuPDF e Pillow. O Word base é aberto em cópia e deve ser diferente do arquivo de saída. Após gerar o Word, exportá-lo para PDF com Word ou LibreOffice e conferir todas as páginas. Para o sumário, o documento possui campo TOC e entradas TC; o cache deve refletir a exportação final. Ao editar e repaginar no Word, atualizar o sumário.

```powershell
python -X utf8 scripts/documentacao/build-ers-template.py --reference docs/referencias/ERS-base-editavel-sprint-2.docx
pnpm docs:check
```

O parâmetro opcional `--page-map` recebe um JSON com as páginas observadas após a exportação para atualizar o cache do sumário. Os identificadores estão em [cabecalhos-modelo.json](cabecalhos-modelo.json). O PDF final deve ser reexportado do Word após essa atualização e novamente conferido. O [registro de verificação](../evidencias/documentacao/ers-modelo-verificacao.json) associa a revisão às fontes, contagens e evidências.

`update-template-pdf.py`, `build-template-word.py`, `secoes.json`, `primeiras-paginas.json` e `figuras/` pertencem ao processo anterior da v2.5. Não devem ser executados para regenerar a revisão 2.6: o processo antigo montava primeiro o PDF e reconstruía o Word com quadros posicionados. A [síntese técnica](../requisitos/ERS-v2.md) e seus arquivos auxiliares também não substituem a ERS completa acima.

Os dois scripts históricos usam por padrão `tmp/documentacao/ers-v2.5`. O primeiro grava PDF, registro e Markdown nessa pasta e recusa substituir o PDF oficial. O segundo exige correspondência entre o hash do PDF histórico e seu registro de figuras. Os detalhes estão no [guia dos geradores](../../scripts/documentacao/README.md).
