# LinkAtletas

Projeto Integrador Interdisciplinar II — ADS, Faculdade de Tecnologia SENAI Félix Guisard. Plataforma para conectar atletas a treinadores e acompanhar o treinamento esportivo, em resposta à demanda SAGA nº 12871 da Ivi-it.

Na Sprint 2, a base React foi integrada a uma API Node/TypeScript e a PostgreSQL. O fluxo abrange cadastro, perfis, conferência profissional manual, recomendação explicável, solicitação e aceite de vínculo, prescrição, execução e feedback. A entrega usa interface web responsiva; React Native permanece no backlog.

## Equipe

João Gabriel Floriano Olimpio; Miguel Oliveira de Almeida; Lucas Souza Silva; Davi Marcondes Paes de Souza; João Pedro Fonseca Alves de Carvalho; Lucca Castilho Costa.

As atribuições do planejamento original não comprovam participação individual. O histórico Git e os registros efetivos de revisão e apresentação devem compor essa evidência.

## Instalação local

Requisitos: Node.js 24, pnpm 10 e Docker Desktop com o engine ativo. Execute na raiz do clone:

```powershell
pnpm install --frozen-lockfile
Copy-Item .env.example .env
docker compose up -d --wait
pnpm db:migrate
pnpm db:seed
pnpm dev:all
```

O arquivo `.env` é opcional para os padrões locais documentados em `.env.example`; copie-o para personalizar o ambiente. Nunca versione credenciais reais.

- Interface: [localhost:5173](http://localhost:5173).
- API: [localhost:3001/api](http://localhost:3001/api).
- Swagger: [localhost:3001/api/docs](http://localhost:3001/api/docs).
- OpenAPI JSON: [localhost:3001/api/openapi.json](http://localhost:3001/api/openapi.json).
- PostgreSQL local: porta `54329`, banco `linkatletas`; consulte usuário/senha de desenvolvimento em `compose.yaml`.

O Compose mantém os dados em volume persistente. `docker compose down` para os serviços sem remover o volume. Não remova volumes para atualizar a aplicação. `pnpm db:migrate` aplica somente migrations ainda não registradas. Seed é explícito e restrito ao desenvolvimento.

## Contas de demonstração

Criadas por `pnpm db:seed`, com dados fictícios:

| Papel | E-mail | Senha local |
|---|---|---|
| Atleta | `emailatleta@email.com` | `senhaatleta` |
| Treinador | `emailtreinador@email.com` | `senhatreinador` |
| Administrador | `admin@linkatletas.local` | `SenhaAdmin123!` |

Também é possível criar novas contas de atleta e treinador na interface. O cadastro público não cria administradores. A autenticação usa sessão do servidor e cookie HttpOnly, não credenciais no localStorage.

## Demonstrar o fluxo

1. Cadastre um treinador, preencha seu perfil e submeta CREF e referência de comprovação. Ele permanece fora das recomendações enquanto pendente.
2. Em outra sessão de navegador, entre como administrador e aprove ou reprove a solicitação com justificativa. A decisão grava auditoria; não representa consulta automática ao conselho.
3. Cadastre um atleta, preencha preferências compatíveis e procure o treinador aprovado.
4. Solicite contratação. O treinador recebe a solicitação e aceita ou recusa. Só o aceite ativa o vínculo; não há cobrança nesta Sprint.
5. Como treinador, crie um treino para o atleta vinculado e publique a ficha. Rascunhos são privados do treinador.
6. Como atleta, registre blocos executados, métricas da modalidade, esforço e comentário. O treinador consulta o retorno.
7. Recarregue para conferir a persistência. Para demonstrar persistência além do processo, encerre e reinicie os serviços mantendo o banco e entre novamente.

## Verificação

```powershell
pnpm typecheck
pnpm build
pnpm test
pnpm exec playwright install chromium
pnpm test:e2e
pnpm test:smoke
```

Os testes usam banco separado `linkatletas_test`; jamais aponte a configuração de testes para uma base com dados importantes. O E2E prepara migrations/seed e usa API 3002/UI 5174, separadas do desenvolvimento 3001/5173. Não execute as duas suítes simultaneamente contra o mesmo banco de teste. Os pré-requisitos e resultados observados estão no [relatório de testes](docs/sprint-2/relatorio-testes.md). Os comandos documentados não constituem por si só evidência de aprovação.

## Arquitetura e execução de produção

React/TypeScript/Vite no cliente; Fastify, Zod e `pg` na API; PostgreSQL 17 no banco. O cliente chama `/api`; Vite encaminha as chamadas em desenvolvimento. Em produção de demonstração, `pnpm start` serve o frontend compilado e a API no mesmo domínio, depois de `pnpm build`.

Configure `NODE_ENV=production`, `DATABASE_URL` explicitamente e `APP_ORIGIN` com a origem HTTPS real. O modo de produção exige cookies seguros; HTTP local não é uma implantação de produção. O padrão de origem no desenvolvimento é `http://localhost:5173`. Para criar um administrador próprio, configure `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` e execute `pnpm db:admin`; o comando exige os três valores, não habilita senha padrão de produção. Banco hospedado, proxy TLS, backups, gestão de segredos e operação pública precisam de configuração própria; este repositório não comprova implantação em nuvem.

```text
server/                 API, segurança, migrations SQL e seed
shared/contracts.ts     contratos públicos TypeScript
src/services/api.ts     cliente HTTP
src/pages/              áreas de atleta, treinador e administrador
tests/                  regras, integração e navegador
docs/sprint-2/          documentação acadêmica e evidências
```

## Documentação da Sprint 2

- [Índice e checklist da entrega](docs/sprint-2/entrega.md).
- [ERS v1.1: requisitos, fluxos e cenários não funcionais](docs/sprint-2/ERS-v1.1.md).
- [Diagramas e fontes editáveis](docs/sprint-2/diagramas.md).
- [Backlog priorizado](docs/sprint-2/backlog.md).
- [Matriz de rastreabilidade e UCs](docs/sprint-2/rastreabilidade.md).
- [Decisões, dificuldades e mudanças de escopo](docs/sprint-2/decisoes.md).
- [Guia da API](docs/sprint-2/api.md).
- [Estado original da base](docs/sprint-2/estado-inicial.md).

## Limitações declaradas

Pagamentos, split, recorrência, cartão, chat em tempo real, avaliações públicas, cancelamento de assinatura, upload S3 e aplicativo nativo estão reservados para evolução. As rotas de financeiro, mensagens e consultorias exibem aviso de recurso futuro. O código demonstrativo original dessas áreas permanece como referência no repositório e não integra a navegação funcional desta Sprint.

Vídeo de exercício pode ser uma referência HTTPS; não há upload de vídeo. A conferência de CREF é manual e acadêmica. O match é uma regra determinística sobre perfis, sem modelo de IA treinado nem validação estatística. Não há comprovação integral de LGPD, criptografia de métricas em repouso, certificação PCI, escala em nuvem ou compatibilidade nativa iOS/Android. Use somente dados fictícios nesta demonstração.

O código original de integração Google Agenda/Meet foi preservado como referência, fora da navegação integrada e do aceite desta Sprint. Se reativado, configurado e acionado em evolução futura, pode criar eventos e enviar convites reais. Não coloque Client Secret ou tokens no frontend.
