# Relatório de testes e evidências — Sprint 2

Data: 14/10/2026. O incremento passou pela verificação de tipos/build, por **33 testes Vitest** e por **2 cenários Playwright/Chromium** na última execução registrada. As contagens abaixo foram conferidas nos JSON gerados pelas suítes; cenários RNF externos a essa cobertura permanecem pendentes.

## Ambiente e pré-requisitos

- Ambiente inspecionado inicialmente: Windows/PowerShell, Node.js `v24.15.0`, pnpm `10.33.2`.
- PostgreSQL 17 em Docker, porta local 54329; banco de desenvolvimento `linkatletas`.
- Integração Vitest: banco exclusivo `linkatletas_test`, definido por `TEST_DATABASE_URL`; a suíte recusa nome sem sufixo `_test` e limpa fixtures desse banco.
- Navegador: Playwright/Chromium, desktop 1440 × 1000 e viewport 390 × 844. Emulação de viewport não representa homologação nativa Android/iOS ou Safari/Firefox/Edge.
- E2E usa igualmente banco com sufixo `_test`, API na porta 3002 e UI na porta 5174, com preparação de migrations e seed para administrador fictício. O fluxo cria contas fictícias únicas; não executar contra ambiente com usuários reais. O desenvolvimento normal continua em 3001/5173.
- Se o Chromium não estiver instalado: `pnpm exec playwright install chromium`.

## Comandos reproduzíveis

Com PostgreSQL disponível, a partir da raiz:

```powershell
pnpm typecheck
pnpm build
pnpm test
pnpm test:e2e
pnpm test:smoke
```

`pnpm test` verifica regras e API contra banco isolado. E2E prepara e inicia sua aplicação isolada conforme `playwright.config.ts`; não executar simultaneamente com outra suíte que limpe o mesmo banco de teste. Não confundir aprovação de build com aprovação funcional.

## Resultados observados

| Verificação | Resultado registrado | Evidência |
|---|---|---|
| Build do frontend original, antes do incremento | Aprovado no ambiente inicial | [estado-inicial.md](estado-inicial.md), commit original `17b32c7` |
| Diagramas Mermaid | Cinco fontes renderizadas com CLI 12.0.0 e cinco PNG inspecionados visualmente em 14/10/2026 | [Fontes e PNG](diagramas.md); erro inicial de parser na nota de sequência corrigido antes da renderização final |
| Typecheck do incremento | Aprovado; inclui cliente, servidor, scripts e testes | [Log do build](evidencias/verificacao-build.txt), executa `pnpm typecheck` |
| Build do incremento | Aprovado | [Log do build](evidencias/verificacao-build.txt); bundle Vite gerado |
| Unidade e API/banco | **33 aprovados, 0 falhas, 0 pendentes**, `success: true` | [vitest-results.json](evidencias/vitest-results.json) |
| Navegador completo e responsividade | **2 esperados/aprovados, 0 inesperados, 0 ignorados, 0 instáveis** | [playwright-results.json](evidencias/playwright-results.json), execução em 14/10/2026; horário/duração exatos no JSON; capturas abaixo |
| Persistência ao recriar aplicação | Aprovado na suíte API: sessão, vínculo, ficha e execução recuperados em nova instância | Teste correspondente em `api.test.ts`; não equivale sozinho a reiniciar PostgreSQL/Docker |
| Reinício real do processo servidor | Aprovado: sessão e dashboard com mesmos IDs recuperados após encerrar/iniciar o processo; frontend estático, Swagger e 404 da API conferidos | [persistencia-servidor.json](evidencias/persistencia-servidor.json), `pnpm test:smoke` |

O smoke usa o banco `_test` e inicia dois processos sequenciais em modo `production` na porta 3003. A conexão permanece HTTP de loopback: isso verifica inicialização, persistência e flags Secure/HttpOnly, sem comprovar implantação HTTPS ou infraestrutura em nuvem. Não houve reinício do contêiner PostgreSQL nesse teste.

## Cobertura executada

| Suíte | Cenários principais |
|---|---|
| [Unidade match](../../tests/unit/matching.test.ts) | Soma 100, exclusão de não aprovados, modalidade, cidade presencial, online, pesos ausentes e campos vazios |
| [API/PostgreSQL](../../tests/integration/api.test.ts) | Conta e duplicidade, papel público, senha, sessão/expiração, origem, perfis, CREF/auditoria, filtros, solicitação, aceite concorrente, vínculo, rascunho, publicação, isolamento, métricas, execução única, recriação de app e logout |
| [Navegador](../../tests/e2e/sprint-2.spec.ts) | Erro de login mobile; novas contas/perfis em contextos separados; admin aprova; atleta solicita; treinador aceita/publica; atleta executa/recarrega; treinador lê feedback; largura sem overflow e erros de runtime |

## Evidências produzidas pelo navegador

Saídas reais geradas pela execução, incluídas no pacote de entrega:

- [Relatório HTML](evidencias/playwright-report/index.html).
- [playwright-results.json](evidencias/playwright-results.json): resultado estruturado.
- [login-mobile-erro.png](evidencias/login-mobile-erro.png): erro real no formulário em 390 px.
- [aprovacao-administrativa.png](evidencias/aprovacao-administrativa.png): decisão fictícia acadêmica.
- [execucao-desktop.png](evidencias/execucao-desktop.png) e [execucao-mobile.png](evidencias/execucao-mobile.png): retorno salvo em 1440/390 px.
- [feedback-treinador.png](evidencias/feedback-treinador.png): retorno consultado pelo treinador.
- `evidencias/playwright-artifacts/`: material de falha quando ocorrer, incluindo traces conforme configuração.

Não incluir cookies, credenciais reais, dados pessoais reais ou prints fabricados. Dados e comprovação profissional utilizados nos testes são fictícios.

## Roteiro complementar de revisão

1. Após uma execução completa, recarregar e reiniciar a API sem apagar o volume; entrar e consultar contrato/ficha/feedback. Registrar comando e saída observados.
2. Em conta nova verificar estados vazios; em API indisponível verificar erro/recuperação sem sucesso falso.
3. Com teclado, percorrer login, perfil e prescrição; testar zoom e focos. Registrar o que foi efetivamente verificado, sem afirmar auditoria completa de acessibilidade.
4. Conferir Swagger/JSON com rotas e schemas de resposta; salvar uma amostra do runtime quando disponível.
5. Comparar DER às migrations e capturas às telas atuais. Abrir os PNG para verificar legibilidade.

## Limites da conclusão

Esta suíte não homologa gateway/PCI, CREF externo, upload S3, chat real, segurança por auditoria independente, LGPD integral, criptografia em repouso, recuperação de backup, capacidade de produção, SLA do match em carga, quatro navegadores ou aplicativos nativos. Cenários RNF não executados continuam pendentes na [ERS](ERS-v1.1.md).
