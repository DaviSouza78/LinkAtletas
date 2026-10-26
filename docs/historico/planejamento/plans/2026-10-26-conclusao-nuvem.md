# Conclusão da nuvem Implementation Plan

**Goal:** concluir a implantação autorizada sem reduzir requisitos nem remover proteções.

**Architecture:** manter a entrada Vercel existente; acrescentar transferência autenticada em partes e respostas em stream. Configurar serviços antes da promoção.

**Tech Stack:** Fastify, PostgreSQL, AWS S3 SDK, Vite/React, Expo, Vitest, Vercel, Brevo.

## Execução nesta sessão

- [x] Configurar buckets e chaves independentes e verificar escrita, leitura e isolamento no Tigris.
- [x] Conectar ao Neon e aplicar as cinco migrações existentes sem seed público.
- [ ] Extrair a gravação validada em `server/modules/media.ts`; conferir bucket existente com HeadBucket antes de tentar criá-lo. Chaves restritas não possuem permissão para criar buckets.
- [ ] Adicionar `server/db/migrations/006_media_uploads.sql` e `server/modules/media-uploads.ts`: criação de sessão, partes autenticadas de 3 MiB, finalização idempotente e limpeza de sessões expiradas.
- [ ] Manter validação e cifragem no servidor; usar streams/Range em `/media/:id/content`.
- [ ] Adaptar `uploadFile` em `src/pages/integrated/Expansion.tsx` e `upload` em `mobile/src/api.ts` para partes acima de 3 MiB.
- [ ] Acrescentar cenários em `tests/integration/platform.test.ts` para arquivo acima de 4,5 MB, leitura por Range, finalização repetida, parte inválida e acesso de terceiro. Executar `pnpm test`, `pnpm build` e typecheck mobile.
- [ ] Concluir SMTP no painel profissional, validar remetente e envio real; preservar credenciais em arquivos locais ignorados e variáveis Secret.
- [ ] Confirmar banco isolado de Preview, aplicar migração nova em ambos os bancos, configurar agendador autenticado e testar endpoint sem segredo.
- [ ] Implantar Preview, verificar saúde, cookies, mídia e e-mail; promover apenas após verificação. Atualizar documentação e evidências, executar `pnpm docs:check`, conferir diff e publicar commits em ambos os repositórios.
