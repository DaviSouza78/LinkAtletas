# Auditoria dos scripts — 28/10/2026

Escopo: leitura dos **24 arquivos executáveis/helpers** versionados em `scripts`, referências no `package.json`, Dockerfile, configurações TypeScript e workflows de CI/Android. Revisão de finalidade, entradas/saídas, caminhos, efeitos sobre dados, falhas e documentação. Não representa homologação de todos os serviços externos nem prova de ausência de defeitos.

## Organização adotada

Mantidas as cinco áreas existentes e seus caminhos de execução, com [índice geral](../../../scripts/README.md) e um README em cada pasta. Não foram removidos scripts usados por workflows nem materiais de reprodução histórica. Os geradores anteriores ficaram identificados e suas saídas foram protegidas para não substituir a ERS final.

## Cobertura da leitura

| Pasta / arquivo | Conferência e conclusão |
|---|---|
| `banco/backup.ts` | Dump cifrado, objetos, manifesto e hashes. Exige pausa de escritas; chave não é incluída. Não usa Neon por `DATABASE_URL`. |
| `banco/restore.ts` | Chave, hashes, autenticação AES, destinos vazios, sufixo `_test` e conferência final. Falhas podem deixar destino parcialmente restaurado. |
| `banco/backup-shared.ts` | Chave original, confinamento do diretório, nomes, processos Docker e worker S3 privado. Configuração operacional deve corresponder à instalação. |
| `banco/export-schema.ts` | Exportação de metadados, dicionário e relações. Não exporta registros; sobrescreve os documentos gerados. |
| `documentacao/check-docs.ts` | Conferência local de links e coerência de contratos/modelos. Ampliada para incluir os guias de scripts. |
| `documentacao/export-openapi.ts` | Exporta a API própria sem iniciar listener; fecha a aplicação no bloco final. |
| `documentacao/build-documents.ts` | Conversão Markdown/DOCX de apoio. Não reproduz o template obrigatório nem os ajustes manuais do PDF. |
| `documentacao/build-ers-template.py` | Montagem Word com fontes/JSONs anteriores. Incluída recusa de referência igual à saída para preservar a base. |
| `documentacao/build-template-word.py` | Processo histórico com quadros. Passou a ler saída histórica isolada e conferir hash antes de usar posições de figuras. |
| `documentacao/update-template-pdf.py` | Processo histórico v2.5. PDF, Markdown e registro passaram a sair em `tmp`, com bloqueio explícito do PDF oficial. |
| `documentacao/generate-use-cases.ts` | SVG gerado do subconjunto conhecido de PlantUML; layout fixo, não conversor genérico. |
| `documentacao/render-use-cases.ts` | Renderização SVG/PNG com fechamento do Chromium. Sobrescreve imagem de saída. |
| `documentacao/render-ers-figures.mjs` | PDFs vetoriais e hashes das figuras, com fechamento do navegador. Artefatos do processo de documentação. |
| `documentacao/render-documents.py` | Leitura dos PDFs e imagens por página. Remove imagens anteriores do mesmo nome; não converte DOCX. |
| `operacao/init-production.ts` | Geração de configuração secreta com criação exclusiva; recusa arquivos existentes. Testada em diretórios temporários. |
| `operacao/production-start.ts` | Migrações antes do tráfego e fechamento do pool. Caminho do Dockerfile preservado. |
| `verificacao/load-matching.ts` | Base `_load_test`, dados sintéticos, HTTP local e percentis. É medição, sem um limite de aprovação de desempenho configurado. |
| `verificacao/smoke-server.ts` | Alias do ensaio TLS. Sua execução reinicia a aplicação; o nome não significa uma consulta inofensiva ao site. |
| `verificacao/verify-backup.ts` | Bancos/buckets isolados e comparação de dados privados. Corrigida leitura do dump para respeitar `BACKUP_ROOT`. |
| `verificacao/verify-private-backup.ts` | Worker privado e aplicação parada no snapshot, com tentativa de retomada no bloco final. Preserva recursos e insere fixture. |
| `verificacao/verify-tls.ts` | Adicionados limites de espera, validação de porta, TLS 1.2/1.3, status de perfil e distinção entre recusa de certificado e falha de rede. |
| `android/connect-android.ts` | Validação de opções antes de ADB/encaminhamento; opções desconhecidas, repetidas ou sem valor são recusadas. |
| `android/start-emulator.sh` | Sintaxe, caminhos do runner, AVD, KVM e limites de espera revisados. Depende do ambiente Linux do workflow. |
| `android/verify-integrated.py` | Ensaio nativo com ações auxiliares HTTP e fixtures. Adicionada recusa de configuração ausente, remota, sem sufixo `_test` ou em produção. |

## Correções aplicadas

1. **ERS final protegida:** o gerador PDF antigo não grava mais sobre o documento entregue. A reconstrução histórica do Word exige correspondência entre PDF e registro de figuras.
2. **Base Word preservada:** referência igual à saída é recusada antes da montagem.
3. **Android com entradas verificadas:** CLI recusa parâmetros inválidos antes de modificar o aparelho. O ensaio integrado exige configuração de banco local de teste; o operador ainda deve garantir que a API usa esse mesmo banco.
4. **Backup configurável:** o teste passa a consultar o dump em `BACKUP_ROOT`, em vez de assumir `tmp/backups`.
5. **TLS com diagnóstico mais preciso:** timeout não é contado como recusa de certificado, e protocolo/status esperados são conferidos.
6. **Navegação e manutenção:** seis READMEs explicam cada arquivo, comandos, destinos, dependências e efeitos. O conferidor de documentos passa a verificar os links destes guias.

## Verificações desta revisão

| Verificação local | Resultado |
|---|---|
| `pnpm build` | Aprovado: tipos da interface, servidor/scripts e testes; build Vite. |
| `pnpm exec vitest run tests/unit` | **61/61**, em dez arquivos; inclui nove verificações novas dos utilitários. |
| Proteções e sintaxe Python | **14/14**: sintaxe dos cinco arquivos Python, ajuda das três CLIs, recusa de PDF oficial, referência Word igual à saída, registro de figuras divergente e três configurações Android inseguras. |
| `bash -n scripts/android/start-emulator.sh` | Sintaxe aprovada; emulador não executado nesta etapa. |
| `node --check scripts/documentacao/render-ers-figures.mjs` | Sintaxe aprovada; figuras não regeneradas. |
| Links dos seis guias e referências de execução/importação | 50 links locais dos READMEs de scripts e referências em package/Docker/workflows/imports conferidos, sem caminhos quebrados. |
| `pnpm docs:check` | 929 links, 63 caminhos OpenAPI, 132 atributos do DER, 47 FKs, 22 chamadas de sequência e 16 casos de uso conferidos; sem links quebrados. |
| `git diff --check` | Sem erros de whitespace. |

Os nove testes novos cobrem seis formas de argumentos Android inválidos, geração coerente da configuração local sem segredos na saída e preservação de cada um dos dois arquivos de configuração existentes. O arquivo de testes permite repetir os cenários; configurações são geradas somente em diretórios temporários.

O Docker local não respondeu a `docker info` dentro de 15 segundos. Assim, **backup/restauração, carga, TLS e APK não foram reexecutados localmente nesta revisão**. Conferência de sintaxe, proteção de entrada e leitura de código não foram contabilizadas como execução desses ensaios. O workflow geral será consultado após a publicação para verificar os cenários que executa em ambiente isolado.

## Limites preservados

- Não foram regenerados a ERS final, seu template, diagramas oficiais ou documentos de entrega para testar os geradores antigos.
- Backup/restauração não são uma transação distribuída e exigem instalação isolada, chave correspondente e pausa de escritas. Os ensaios preservam recursos; não há limpeza automática nem agendamento recorrente nesta pasta.
- Geradores Word dependem de fontes e revisão visual após exportação. Não se promete reprodução idêntica do PDF ajustado manualmente.
- O Android é cliente de atleta. Ações auxiliares HTTP do treinador não são testes nativos desse papel; emulador não equivale a aparelho físico.
- Uma leitura de código ou compilação não substitui executar cada cenário no ambiente adequado. Resultados históricos permanecem identificados pela própria execução.

[Scripts](../../../scripts/README.md) · [Testes unitários dos utilitários](../../../tests/unit/scripts.test.ts) · [Automação geral](../../../.github/workflows/ci.yml) · [Automação Android](../../../.github/workflows/android-integrated.yml)
