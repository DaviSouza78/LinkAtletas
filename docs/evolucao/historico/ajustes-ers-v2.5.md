# Ajustes da ERS v2.5 — 24/10/2026

Solicitação de Lucca após conferir o PDF e o Word convertido da v2.4. Escopo: estrutura do template, espaçamento e fidelidade do Word completo; sem mudança nas funcionalidades da aplicação.

- [x] Conferido o PDF original: não há subseção 5.4.1 nem lista “Relatório completo e limites” ao final dos casos. Esses acréscimos foram retirados da ERS; o [dicionário de dados](../dicionario-dados.md) e o [relatório](../relatorio-testes.md) continuam separados.
- [x] Mantidos os 32 RF, 16 RNF, 16 RN e 16 CT. Cada CT conserva sua evidência individual, com data e ambiente reais registrados.
- [x] Acrescentado intervalo antes dos casos de teste e antes do capítulo 7. Eliminada a lista final que ficava entre CT016 e apêndices.
- [x] Mantido o título 7, presente no template original, em preto. Texto breve informa que não se aplica nesta entrega; apêndices são materiais complementares opcionais, não requisitos ausentes do corpo.
- [x] Versão e histórico atualizados para 2.5; sumário recalculado. PDF final com 60 páginas.
- [x] Word completo reconstruído com parágrafos editáveis posicionados nas coordenadas do PDF. Isso evita a detecção incorreta de colunas e tabelas que prejudicou a conversão anterior.

Documentos atuais: [PDF](../ERS-template-original-atualizada.pdf) e [Word completo](https://github.com/DaviSouza78/LinkAtletas/blob/c472f2709d4053dda051d8d4da18fc9bf3096d8a/docs/evolucao/ERS-completa-v2.5-editavel.docx). O arquivo ERS-v2.docx continua uma síntese auxiliar e não deve ser confundido com o Word completo.

## Funcionamento do Word

O texto do corpo, títulos, valores e textos das células permanecem editáveis em quadros posicionados. As linhas/bordas, fundos e demais elementos gráficos do template são preservados em uma camada de imagem; diagramas e capturas também são imagens. Não se trata de páginas inteiras transformadas em fotografias: o texto corrente foi retirado da camada gráfica e recriado como texto do Word.

Essa montagem preserva o posicionamento para ajustes pontuais. Não oferece o mesmo refluxo de um documento originalmente criado com tabelas e parágrafos corridos: alterações longas podem exigir redimensionar ou reposicionar quadros. O Word original do template não foi disponibilizado. Não se promete identidade de pixels em todas as versões de Word, fontes instaladas e conversores; a conferência registra o ambiente efetivamente renderizado.

Verificações: [PDF](../evidencias/ers-template-verificacao.json) e [comparação do Word renderizado](../evidencias/ers-word-verificacao.json). A verificação do conteúdo compara, por página, os termos do PDF com os extraídos da renderização do Word, excluindo textos já contidos em figuras. A inspeção visual abrange todas as páginas e amplia capa, histórico, tabelas, CREF, sumário e separação dos testes/apêndices. Validação XML é complementar e não substitui essa conferência visual.

Reprodução: gerar o PDF com `python -X utf8 scripts/update-template-pdf.py` e o Word completo com `python -X utf8 scripts/build-template-word.py`; renderizar o DOCX em PDF pelo LibreOffice e conferir novamente. A revisão é documental e não é nova execução de testes da aplicação.
