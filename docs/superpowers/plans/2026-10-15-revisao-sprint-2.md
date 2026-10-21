# Revisão da Sprint 2 e verificação integrada do aplicativo

> Execução autorizada por Lucca em 15/10/2026, como continuidade da ampliação aprovada. Aplicar executing-plans; execução nesta sessão, com validação das correções e resultados reais.

**Objetivo:** recuperar os serviços locais sem apagar dados, corrigir inconsistências técnicas/documentais e testar um APK conectado à API, entregando checklist de dependências externas e commits de Lucca.

**Arquitetura:** preservar Fastify/PostgreSQL, React e Expo. Produção mantém HTTPS. Um perfil explícito de demonstração Android permite HTTP somente em loopback/endereço do emulador, com pacote separado e API local via `adb reverse`. Testes usam dados fictícios e bases isoladas. A publicação pública de backend e serviços financeiros continua dependente das contas do responsável.

**Ferramentas:** PowerShell, Docker, TypeScript, Vitest, Playwright, Gradle/Android Emulator no GitHub Actions e automação da interface Android por ADB/UIAutomator.

## 1. Serviços locais

- [x] Diagnosticar processos e socket que impediram a inicialização do Docker; encerrar somente os processos do Desktop identificado e preservar bancos/volumes/chaves.
- [x] Recuperar a inicialização, executar `docker compose up -d --wait`, `pnpm db:migrate` e consultar saúde real da API.
- [x] Registrar comandos e resultado; se o Windows exigir intervenção/reinício, registrar a falha exata sem alegar recuperação.

## 2. Materiais e código

- [x] Extrair e comparar todos os documentos em `C:/Users/user/Downloads/integrador`, incluindo regulamento, roteiro, ERS, proposta e templates.
- [x] Conferir ERS, modelos, backlog, API, matriz, manual, checklist e resultados contra os enunciados e implementação atual; manter os originais e identificar alterações.
- [x] Revisar autenticação, contratos, treino, comunicação, financeiro, mídia/privacidade e telas nativas; corrigir problemas comprovados com regressões apropriadas.
- [x] Criar `docs/evolucao/servicos-externos-sprint-2.md`: obrigação explícita, dependência do fluxo, alternativa local, estado de teste, acessos e procedimento de homologação por serviço.

## 3. APK integrado

- [x] Separar configuração nativa em `mobile/src/config.ts`; testar recusa de HTTP em produção, recusa de domínio documental e limitação de HTTP local aos endereços autorizados.
- [x] Criar configuração Expo/plugin de demonstração local: identificador Android próprio, tráfego claro restrito aos domínios locais, sem permissões novas ou segredo no bundle.
- [x] Criar workflow manual com PostgreSQL, SMTP e S3 reais, API e emulador isolados; compilar APK standalone e conectar por `adb reverse tcp:3001 tcp:3001`.
- [x] Automatizar ações no APK real: validação de acesso, autenticação, perfil, vínculo/treino, chat, agenda e privacidade; conferir persistência no servidor. Capturar XML, telas e logs, sem senhas/tokens nos relatórios.
- [x] Corrigir falhas encontradas, repetir somente os cenários necessários e depois executar a suíte final. Distribuir o APK local com instruções de conexão e limites explícitos de dispositivos/iOS.

## 4. Entrega revisada

- [x] Atualizar documentos, ERS/relatório Word e PDF e renderizar para inspeção.
- [x] Executar tipos/build, testes de API/web/nativo, links/OpenAPI e ensaio Android real; guardar evidências com data e ambiente.
- [x] Publicar commits de `Lucca <luccacc.contato@gmail.com>` com mensagens em português, diretas, minúsculas e sem acentos; conferir CI e atualizar pacote de verificação.
- [x] Relatar somente dependências que realmente não puderem ser resolvidas nesta sessão; não presumir aprovação docente, participação de colegas ou entrega acadêmica.
