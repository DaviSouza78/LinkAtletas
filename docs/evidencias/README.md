# Evidências de verificação

Esta pasta guarda resultados de execuções: relatórios JSON, capturas e registros de integração. Ela permite conferir quais cenários foram executados, quando e com qual resultado, sem depender do acesso administrativo aos serviços.

O código que realiza os testes está em [tests](../../tests/README.md); esta pasta contém a saída das execuções, não outra implementação dos testes.

| Conteúdo | Finalidade |
|---|---|
| [relatorio-testes.md](relatorio-testes.md) | Quantidades, nomes dos cenários e limites de interpretação. |
| [execucoes/server-2026-10-28](execucoes/server-2026-10-28/README.md) | Referência mais recente preservada para unidade/API, navegador, backup, TLS e produção. |
| [nuvem](nuvem/README.md) | Verificações específicas de banco, S3, SMTP e agendador. |
| [api](api/README.md) | Metadados de esquema usados pelo dicionário e pelo DER. |
| [android](android/README.md) | Identificação e inicialização do APK HTTPS; demais evidências móveis ficam em `mobile/docs`. |
| [documentacao](documentacao/README.md) | Conferência dos links e contratos documentados. |
| [relatorios](relatorios/README.md) | Explicações de revisões e implantação, com data e escopo. |

As execuções repetidas e os diagnósticos superados foram retirados da árvore atual. Os dois JSONs na entrada, [vitest-results.json](vitest-results.json) e [android-integrated-result.json](android-integrated-result.json), continuam porque são as fontes dos resultados citados nos casos de teste da ERS fornecida. São históricos e não devem ser somados aos resultados posteriores.

Resultados antigos não comprovam uma nova execução ou homologação externa. Relatórios HTML e traces temporários permanecem ignorados pelo Git. Os scripts podem gerar novas saídas nos diretórios configurados para cada execução.
