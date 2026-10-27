# LinkAtletas

Plataforma que conecta atletas a treinadores e reúne perfis esportivos, contratação, treinos e acompanhamento de resultados. Projeto Integrador Interdisciplinar II de ADS, Faculdade de Tecnologia SENAI Félix Guisard, desenvolvido para a demanda SAGA nº 12871 da Ivi-it.

[Acessar aplicação](https://link-atletas.vercel.app) · [Documentação](docs/README.md) · [Entrega da Sprint 2](docs/evolucao/checklist-sprint-2.md)

## Funcionalidades

- Cadastro e autenticação de atletas, treinadores e administradores.
- Conferência manual de CREF, com decisão, validade e auditoria.
- Busca de treinadores por compatibilidade e gestão dos vínculos.
- Prescrição de treinos, registro de execução e feedback.
- Mensagens, notificações, avaliações e agenda de consultorias.
- Arquivos privados cifrados, consentimentos e recuperação de senha.
- Aplicativo Android do atleta conectado à mesma API.

O modo financeiro acadêmico não realiza cobranças. A integração Asaas depende de credenciais e homologação próprias; pagamentos reais e publicação nas lojas não fazem parte da demonstração atual.

## Tecnologias e serviços

| Camada | Tecnologias |
|---|---|
| Web | React, TypeScript e Vite |
| API | Node.js 24, Fastify e PostgreSQL |
| Aplicativo | React Native e Expo |
| Desenvolvimento | Docker Compose, PostgreSQL, SeaweedFS e Mailpit |
| Nuvem | Vercel, Neon, Tigris, Brevo e cron-job.org |
| Qualidade | Vitest, Playwright, axe e GitHub Actions |

## Executar localmente

Pré-requisitos: Node.js 24, pnpm 10.33.2 e Docker Desktop em execução. Na primeira instalação:

```powershell
pnpm install --frozen-lockfile
Copy-Item .env.example .env
docker compose up -d --wait
pnpm db:migrate
pnpm db:seed
pnpm dev:all
```

Preserve um `.env` existente. O seed é exclusivo de desenvolvimento; não o execute na base pública.

- Interface: [localhost:5173](http://localhost:5173).
- API e Swagger: [localhost:3001/api/docs](http://localhost:3001/api/docs).
- E-mails de desenvolvimento: [localhost:8025](http://localhost:8025).
- Contas fictícias, configuração do app, diagnóstico de portas e backup: [manual de execução](docs/evolucao/manual.md).

## Verificar o projeto

```powershell
pnpm build
pnpm test
pnpm docs:check
pnpm exec playwright install chromium firefox webkit
pnpm test:e2e
```

Os testes de integração usam bancos isolados com sufixo `_test`. Não aponte as suítes para produção nem execute suítes concorrentes sobre a mesma base de teste. Consulte os [resultados e limites das verificações](docs/evolucao/implantacao-2026-10-26.md).

## Estrutura

```text
src/          interface web integrada
server/       API, autenticação, serviços, jobs e migrações
shared/       contratos compartilhados entre web, API e aplicativo
mobile/       aplicativo React Native e instruções próprias
tests/        testes de unidade, integração e navegador
infra/        configuração dos serviços locais e proxy TLS
scripts/      execução, documentação, backup e verificações
docs/         documentação atual, evidências e histórico acadêmico
.github/      automações de verificação e compilação Android
```

## Documentação e entrega

- [ERS final v2.6 ajustada pela equipe em PDF](docs/evolucao/ERS-template-original-atualizada.pdf).
- [Checklist dos nove entregáveis](docs/evolucao/checklist-sprint-2.md), [diagramas](docs/evolucao/diagramas.md), [backlog](docs/evolucao/backlog.md) e [matriz de UCs](docs/evolucao/rastreabilidade.md).
- [API](docs/evolucao/api.md), [aplicativo](mobile/README.md) e [implantação na Vercel](docs/evolucao/vercel.md).
- [Testes de nuvem e APK](docs/evolucao/implantacao-2026-10-26.md), [decisões técnicas](docs/evolucao/decisoes.md) e [pendências](docs/evolucao/pendencias-lucca.md).

O [índice da documentação](docs/README.md) identifica os documentos principais, as fontes auxiliares da ERS e os materiais históricos. A equipe deve revisar a demonstração e cada integrante concluir sua entrega acadêmica.
