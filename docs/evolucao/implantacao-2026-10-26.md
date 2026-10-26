# Implantação remota — 26/10/2026

- [x] Tigris privado, buckets e credenciais separados por ambiente; [Production](evidencias/tigris-2026-10-26.json) e [Preview](evidencias/tigris-preview-2026-10-26.json) testados.
- [x] Neon com seis migrações em `main` e `preview/preparacao-vercel`, sem seed público; [evidência](evidencias/neon-migrations-2026-10-26.json).
- [x] Brevo gratuito, remetente verificado e SMTP autenticado com STARTTLS; e-mail técnico aceito para o titular da conta. [Evidência](evidencias/brevo-2026-10-26.json); aceite SMTP não comprova chegada à caixa de entrada.
- [x] Variáveis SMTP cadastradas como Secret para Production e Preview. Chaves, senhas e URLs de banco preservadas apenas em arquivos locais ignorados e nos serviços autorizados.
- [x] Sessões de upload em partes de 3 MiB, limites de 10/50 MiB preservados, arquivos e partes cifrados, finalização idempotente, limpeza e download em stream/Range implementados.
- [x] 98 testes de API/unidade aprovados, incluindo transferência sintética de 50 MiB; [relatório](evidencias/nuvem-2026-10-26-vitest.json). Não comprova reprodução de vídeo real no dispositivo.
- [x] Build e TypeScript web/servidor, TypeScript mobile e 22 testes do aplicativo aprovados.
- [x] Cron-job.org configurado para produção a cada minuto com Bearer restrito à rota de jobs; tarefa `8728881` salva desativada até a implantação passar. Não salva corpos de resposta no histórico.
- [ ] Concluir revisão dos três navegadores. Primeira execução teve 14/15; o teste precisava aguardar o salvamento do consentimento. A segunda teve 14/15 e travou na ação de clique do WebKit; investigação e nova execução em andamento.
- [ ] Implantar e validar Preview com serviços reais, incluindo arquivos acima de 4,5 MB e recuperação de senha.
- [ ] Promover a versão validada para produção e confirmar saúde, sessão, permissões e navegação pública.
- [ ] Ativar e confirmar execução real do cron, sem remover proteção do endpoint.
- [ ] Concluir conta administrativa, backup/retomada e testes reais de aceite da implantação. Atualizar este registro com os resultados, sem presumir sucesso.

Este documento registra progresso. O checklist acadêmico e a ERS não devem ser apresentados como prova de uma implantação remota ainda não verificada.
