# Auditoria de dependências — 21/10/2026

Executada com os lockfiles da revisão, por `pnpm audit --json` na raiz e `pnpm --dir mobile audit --json`, incluindo dependências de produção e desenvolvimento. [Resultado resumido](evidencias/auditoria-dependencias.json). O parâmetro `--prod` inclui ferramentas que o Expo declara como dependências do pacote, mesmo quando usadas para compilar/configurar o projeto.

## Correções aplicadas

- [x] Vite 8.2.1 → 8.2.4 em 21/10, corrigindo três avisos relacionados ao `launch-editor` incorporado: [GHSA-698v-4r3x-3vcv](https://github.com/advisories/GHSA-698v-4r3x-3vcv), [GHSA-r825-w8mm-5pxw](https://github.com/advisories/GHSA-r825-w8mm-5pxw) e [GHSA-587h-7wmj-h5pm](https://github.com/advisories/GHSA-587h-7wmj-h5pm). A auditoria completa da raiz foi repetida e retornou zero alertas. Build e 82 testes passaram novamente. O servidor web de desenvolvimento e a API foram conferidos em loopback, sem escuta na LAN por padrão.

- [x] `@fastify/static` 8.3.0 → 10.1.6 e `@fastify/swagger-ui` 5.2.6 → 6.1.2. Eliminadas versões transitivas antigas do plugin; ambas são compatíveis com Fastify 5 conforme a [matriz oficial](https://github.com/fastify/fastify-static#compatibility).
- [x] Atualizadas as resoluções de `brace-expansion` e `source-map-js`. A auditoria da raiz retornou **zero alertas conhecidos**; isso não equivale a garantia de ausência de falhas.
- [x] `xcode>uuid` 7.0.3 → 11.1.1 por override restrito no manifesto móvel. O uso de `uuid.v4()` permanece compatível; tipos, dependências Expo, exportação e testes foram reexecutados.
- [x] Acrescentadas regressões reais de leitura pública e tentativas de escapar da raiz de arquivos estáticos: [testes](../../tests/unit/static-security.test.ts).

- [x] Vitest 3.2.7 → 4.1.11 na raiz e no cliente móvel, corrigindo avisos do mocker e removendo versões vulneráveis do pool de workers. [Guia oficial de migração](https://v4.vitest.dev/guide/migration.html).

## Alertas sem correção publicada

| Dependência transitiva móvel | Alerta confirmado | Exposição e decisão |
|---|---|---|
| `expo > @expo/cli > node-forge` 1.4.0 | [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv), alto, verificação RSA PKCS#1 v1.5 | Ferramenta de CLI; a aplicação não usa sua função de verificação para autenticar usuários, webhooks ou conteúdo. Não executar comandos de certificados com entradas não confiáveis. Aguardar correção do fornecedor; não substituir criptografia por implementação improvisada. |
| `expo > @expo/metro > metro-file-map > micromatch > braces` 3.0.3 | [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), alto, esgotamento de pilha com padrão elaborado | Ferramenta de bundling; configurações/padrões do build vêm do repositório, não dos formulários do atleta. Não usar padrões arbitrários de terceiros na configuração do Metro. Aguardar versão corrigida. |

As versões disponíveis no registro nesta execução eram 1.4.0 e 3.0.3; os avisos não indicavam versão corrigida. Os dois alertas permanecem registrados, sem exclusão ou supressão da auditoria. Não foram identificados imports dessas ferramentas no código de negócio nativo. Atualizar o Expo e repetir auditoria/Doctor/exportação/ensaio Android quando a correção oficial estiver disponível.

Esta restrição não exige abrir conta em um serviço externo. É uma pendência de manutenção do ecossistema. Para executar projeto recebido de terceiros, revisar primeiro scripts e configuração de build.
