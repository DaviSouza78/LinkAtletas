# ERS no template original

Documentos completos de apresentação da Sprint 2: [PDF no template](../ERS-template-original-atualizada.pdf) e [Word editável v2.5](../ERS-completa-v2.5-editavel.docx), revisão de 24/10/2026. A [ERS original da Sprint 1](../../referencias/ERS-Sprint-1-original.pdf) permanece intacta. Veja os [ajustes da v2.5](../ajustes-ers-v2.5.md); o registro da auditoria aplicada à v2.4 permanece histórico.

Preservam-se capa, identificação, histórico, capítulos 1–7, dimensões, margens, Arial e tamanhos do texto do template. As 13 páginas iniciais recebem correções nos campos necessários; o restante é repaginado para integrar os requisitos e desenvolver os testes. A continuação original da tabela de siglas também foi mantida. Histórico usa Arial Bold/Times New Roman de 10 pontos, conforme a tabela original; corpo usa Arial de 12 pontos, títulos principais Arial Bold de 14 pontos. Figuras mantêm sua tipografia própria. Não se reduz fonte para impor quantidade de páginas.

Os apêndices duplicados foram retirados. RF-01–24 e RF-A01–A08, 16 RNF, 16 RN, cronograma, telas e diagramas atuais estão no corpo. A seção 6 contém CT001–CT016 com resultados históricos rastreados e espaçamento entre os casos. A seção 7 tem título preto uma única vez no corpo, com nota de não aplicabilidade. Não há subseção 5.4.1 nem lista final de relatórios: não pertenciam ao template. O detalhe do banco fica no documento técnico separado. O sumário do PDF inclui as páginas físicas, links internos e marcadores.

## Fontes e reprodução

- [primeiras-paginas.json](primeiras-paginas.json): campos corrigidos sobre a fonte original.
- [requisitos.json](requisitos.json): 32 requisitos completos, fluxos, exceções, prioridade, estado e aceite.
- [secoes.json](secoes.json): histórico, cronograma, legendas, referências e demais seções.
- [testes.json](testes.json): 16 casos e títulos exatos das asserções aprovadas nos registros preservados.
- [ERS-v2.md](../ERS-v2.md): síntese auxiliar de escopo, UC, RNF e regras; mantém Word/PDF auxiliares. As especificações completas integradas estão no documento principal e no [texto repaginado](../ERS-template-original.md).
- [atualizacoes.json](atualizacoes.json): entrada histórica da tentativa v2.3, conservada para rastreabilidade; não é usada pelo gerador atual.

Ambiente: Windows com Arial, Arial Bold e Times New Roman, Python com PyMuPDF/Pillow e dependências Node do repositório. Com o Chromium do Playwright disponível, executar na raiz:

```powershell
node scripts/render-ers-figures.mjs
python -X utf8 scripts/update-template-pdf.py
python -X utf8 scripts/build-template-word.py
pnpm exec tsx scripts/build-documents.ts ERS-v2
pnpm docs:check
```

A primeira etapa converte os SVGs pelo Chromium preservando CSS e vetores. O [manifesto](figuras/manifesto.json) relaciona hashes da fonte e do PDF de cada figura, e o gerador recusa assets desatualizados. A segunda etapa gera o PDF principal, o texto repaginado e o [registro verificável](../evidencias/ers-template-verificacao.json). A conversão do Word auxiliar para PDF exige LibreOffice e não recria o template original.

O gerador falha em âncoras ambíguas, texto sem espaço nos campos iniciais, margens excedidas, sumário inconsistente ou caso sem asserção aprovada correspondente. Compara as 13 páginas iniciais fora das áreas corrigidas e renderiza todas as páginas para inspeção em `%TEMP%/linkatletas-ers-template-review`. A inspeção visual deve ser registrada após conferir essas imagens; geração não é revisão visual automática.

Não foi encontrado o Word editável original. O Word completo v2.5 é uma reconstrução com parágrafos/quadros posicionados e texto editável, mantendo o desenho do template em camada gráfica; imagens e diagramas permanecem imagens. Textos maiores podem exigir ajustar o quadro, em vez de refluir automaticamente como em um documento de texto corrido. A cópia foi renderizada e comparada no ambiente documentado; não se garante identidade de pixels em todos os editores. O Word auxiliar ERS-v2.docx é uma síntese distinta. A revisão não é homologação de nuvem, dispositivo físico, conselho ou gateway, nem nova execução dos testes históricos.
