# Implantação remota — 26/10/2026

- [x] Tigris privado, buckets e credenciais separados por ambiente; [Production](evidencias/tigris-2026-10-26.json) e [Preview](evidencias/tigris-preview-2026-10-26.json) testados.
- [x] Neon com seis migrações em `main` e `preview/preparacao-vercel`, sem seed público; [evidência](evidencias/neon-migrations-2026-10-26.json).
- [x] Brevo gratuito, remetente verificado e SMTP autenticado com STARTTLS; e-mail técnico aceito para o titular da conta. [Evidência](evidencias/brevo-2026-10-26.json); aceite SMTP não comprova chegada à caixa de entrada.
- [x] Variáveis SMTP cadastradas como Secret para Production e Preview. Chaves, senhas e URLs de banco preservadas apenas em arquivos locais ignorados e nos serviços autorizados.
- [x] Sessões de upload em partes de 3 MiB, limites de 10/50 MiB preservados, arquivos e partes cifrados, finalização idempotente, limpeza e download em stream/Range implementados.
- [x] 99 testes de API/unidade aprovados, incluindo transferência sintética de 50 MiB e handler serverless; [relatório](evidencias/nuvem-2026-10-26-vitest.json). Não comprova reprodução de vídeo real no dispositivo.
- [x] Build e TypeScript web/servidor, TypeScript mobile e 22 testes do aplicativo aprovados.
- [x] Cron-job.org configurado para produção a cada minuto com Bearer restrito à rota de jobs; tarefa `8728881` salva desativada até a implantação passar. Não salva corpos de resposta no histórico.
- [x] Revisão completa dos três navegadores: 15/15 aprovados, sem retries, incluindo envio real pela interface acima de 5 MiB. [Relatório final](evidencias/verificacao-nuvem-entrega-2026-10-26/playwright-results.json). Tentativas anteriores expuseram navegação antes de salvar consentimento, instabilidade de clique durante animações e interrupção do servidor de teste; a execução final aguarda a confirmação de gravação e usa a preferência de movimento reduzido já suportada pela interface.
- [x] Implantar e validar Preview com serviços reais: [arquivo acima de 5 MiB](evidencias/vercel-preview-2026-10-26.json), [limite de 50 MiB](evidencias/vercel-preview-50mib-2026-10-26.json), hashes, Range, permissões, finalização idempotente e exclusão. A primeira tentativa foi interrompida por reset da conexão cliente antes do ensaio máximo; o ensaio separado de 50 MiB concluiu. [Recuperação de senha](evidencias/vercel-recuperacao-2026-10-26.json) também aprovada.
- [ ] Promover a versão validada para produção e confirmar saúde, sessão, permissões e navegação pública.
- [ ] Ativar e confirmar execução real do cron, sem remover proteção do endpoint.
- [x] Criar administrador de produção com senha aleatória privada, sem seed público: [registro](evidencias/administrador-nuvem-2026-10-26.json). Login remoto de produção ainda será conferido.
- [x] Snapshot cifrado dos dados Neon de produção restaurado em PostgreSQL local isolado, com contagens das 37 tabelas e hash administrativo conferidos: [registro](evidencias/backup-nuvem-2026-10-26.json). Não restaura nem substitui produção e não comprova backup de objetos S3.
- [x] Jornada principal real por HTTPS em Preview: CREF manual, bloqueios por papel, vínculo, treino, execução, feedback e mensagens entre sessões: [registro](evidencias/vercel-fluxo-2026-10-26.json). Dados sintéticos encerrados após o teste.
- [x] Recuperação de senha pela aplicação remota: outbox cifrada, SMTP aceito, redefinição, token de uso único e revogação de sessão: [registro](evidencias/vercel-recuperacao-2026-10-26.json). A chegada à caixa de entrada não foi confirmada; token de teste obtido pelo responsável na outbox privada.
- [x] APK compilado com a URL HTTPS de produção no bundle, instalado e iniciado no emulador: [registro](evidencias/android-nuvem-2026-10-26.json), [captura](evidencias/android-nuvem-inicializacao-2026-10-26.png). Esse ensaio verifica a inicialização, não uma jornada completa em aparelho físico.

Este documento registra progresso. O checklist acadêmico e a ERS não devem ser apresentados como prova de uma implantação remota ainda não verificada.

## Compatibilidade e verificações adicionais

O primeiro Preview desta etapa falhou com `ERR_REQUIRE_ESM` ao carregar `content-disposition@3` por `@fastify/static`. A dependência desse plugin foi fixada em `2.0.1` (CommonJS, mesma API utilizada). O teste da entrada de produção também passou a executar Node com `--no-experimental-require-module`, reproduzindo essa restrição antes da publicação. Atualizações de Zod, Nodemailer e fast-uri eliminaram os apontamentos da [auditoria das dependências de produção](evidencias/audit-producao-2026-10-26.json); build e os 98 testes foram reexecutados e aprovados.

A conferência do esquema revelou apenas uma diferença de ordem de colunas entre banco antigo migrado e banco criado do zero. A exportação de metadados agora ordena as colunas de forma estável; nenhuma coluna foi removida para fazer a CI passar. A [CI completa](https://github.com/DaviSouza78/LinkAtletas/actions/runs/40415534765), a [compilação Android](https://github.com/DaviSouza78/LinkAtletas/actions/runs/40409474125) e o [ensaio de inicialização](https://github.com/DaviSouza78/LinkAtletas/actions/runs/40415556849) concluíram com sucesso.

Os testes remotos encontraram também a exigência de um export default no runtime. A entrada agora exporta um handler HTTP, inicializa a aplicação uma vez sob demanda e aguarda as rotas prontas sem abrir outra porta na Vercel. O teste local da entrada reproduz esse contrato; o Preview respondeu 200 com PostgreSQL conectado. O modo local conserva o servidor convencional.
