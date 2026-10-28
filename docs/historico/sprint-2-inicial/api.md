# API REST — Sprint 2

Base local: `http://localhost:3001/api`. O navegador usa a mesma base relativa `/api`; Vite faz proxy no desenvolvimento. Documentação runtime: [Swagger](http://localhost:3001/api/docs) e [OpenAPI JSON](http://localhost:3001/api/openapi.json). A definição é gerada a partir dos schemas das rotas. Tipos públicos: [`shared/contracts.ts`](../../../shared/contracts.ts). `pnpm api:export` gera uma cópia versionável em [`openapi.json`](openapi.json); após mudar contratos, exporte novamente para manter a cópia coerente.

## Sessão, origem e erros

Login/cadastro criam cookie `la_session` HttpOnly, SameSite=Lax e Secure em produção. Clientes devem aceitar/enviar cookies (`credentials: 'include'` no fetch). O servidor guarda hash do token e sua expiração. Não enviar token no JSON nem persistir senha no navegador. Operações que alteram dados exigem cabeçalho `Origin` autorizado, inclusive por clientes de linha de comando. No desenvolvimento usar `Origin: http://localhost:5173`; origem do próprio servidor também é aceita conforme configuração.

Respostas singulares/plurais envolvem recurso por nome: `{ user }`, `{ profile }`, `{ coaches }`, `{ contract }`, `{ workouts }`. `GET /auth/session` devolve `{ user: null }` para visitante. Identificadores são UUID em strings e datas de treino usam `YYYY-MM-DD`. Valores monetários são números decimais e não transações financeiras neste incremento.

```json
{"code":"VALIDATION_ERROR","message":"Confira os dados informados.","fields":{"effort":["Informe um valor de 1 a 10."]}}
```

O exemplo ilustra o formato; mensagem/código concreto pode variar pela regra. `fields` é opcional. Códigos HTTP: 400 entrada inválida; 401 sessão ausente/expirada ou login incorreto; 403 papel/origem indevidos; 404 recurso inexistente ou privado de outro usuário; 409 duplicidade/estado conflitante; 429 limite de tentativas; 500 falha inesperada com mensagem pública genérica. Não interpretar toda resposta 2xx como criação: PUT pode atualizar uma execução existente.

## Endpoints

Todos os caminhos da tabela são relativos a `/api`.

| Método / rota | Acesso | Entrada / saída principal |
|---|---|---|
| GET `/health` | Público | Confirma conexão com PostgreSQL; não expõe credenciais |
| POST `/auth/register` | Público | `{name,email,password,role}`; role somente `athlete`/`coach`; 201 `{user}` e cookie |
| POST `/auth/login` | Público | `{email,password}` → `{user}` e cookie; tentativas limitadas |
| GET `/auth/session` | Público | `{user}` ou `{user:null}` |
| POST `/auth/logout` | Sessão quando existente | `{}` → `{ok:true}`; invalida sessão e limpa cookie |
| GET `/profiles/me` | Autenticado | `{profile}` privado do próprio usuário |
| PUT `/profiles/me` | Autenticado | Perfil completo conforme contrato → `{profile}` |
| GET `/coaches` | Atleta | Filtros opcionais `sport`, `query`, `maxPrice`, `mode` → `{coaches}` com `score/reasons` |
| POST `/verifications` | Treinador | `{cref,evidence}` → 201 `{verification}` pendente; perfil mínimo completo obrigatório |
| GET `/verifications` | Treinador | `{verifications}` do próprio profissional |
| GET `/admin/verifications` | Admin | Fila/histórico de submissões `{verifications}` |
| PATCH `/admin/verifications/:id` | Admin | `{status:'approved'|'rejected',reason}` → `{verification}`; justificativa obrigatória |
| GET `/contracts` | Autenticado | `{contracts}` em que usuário participa |
| POST `/contracts` | Atleta | `{coachId}` → 201 `{contract}` pending; sem cobrança |
| PATCH `/contracts/:id` | Treinador destinatário | `{status:'active'|'rejected'}` → `{contract}`; somente pending |
| GET `/workouts` | Autenticado | `{workouts}` próprios; atleta só recebe publicados |
| POST `/workouts` | Treinador do vínculo ativo | `WorkoutInput` → 201 `{workout}` |
| GET `/workouts/:id` | Participante autorizado | `{workout}`; rascunho só treinador proprietário |
| PUT `/workouts/:id` | Treinador proprietário | `WorkoutInput` → `{workout}`; respeita restrições de publicação/execução |
| PUT `/workouts/:id/execution` | Atleta da ficha publicada | `ExecutionInput` → `{workout}` com execução única criada/atualizada |
| GET `/metrics?sport=Corrida` | Autenticado | `{metrics}` com `sport,key,label,unit,min,max` |
| GET `/dashboard` | Autenticado | `{contracts,workouts}` filtrados por usuário |

## Exemplos fictícios

### Perfil

`PUT /profiles/me` substitui os campos editáveis enviados; situação profissional não pode ser autoaprovada nesse payload.

```json
{
  "name": "Atleta de Demonstração",
  "city": "Taubaté",
  "bio": "Conta fictícia para apresentação acadêmica.",
  "sports": ["Corrida"],
  "goals": ["Performance"],
  "levels": ["Iniciante"],
  "availability": ["Segunda manhã"],
  "mode": "online",
  "budget": 200,
  "price": 0
}
```

Modalidades disponíveis nesta versão: Corrida, Musculação, Natação, Ciclismo e Triatlo. Modo: `online`, `presencial`, `hibrido`. Catálogos de objetivos, níveis e horários estão em `shared/contracts.ts`; valores desconhecidos são rejeitados. Não enviar estado de CREF no perfil.

### Ficha

Substitua `contractId` pelo vínculo real ativo. Treinador é inferido pela sessão; atleta é inferido pelo contrato.

```json
{
  "contractId": "00000000-0000-4000-8000-000000000001",
  "title": "Corrida confortável",
  "sport": "Corrida",
  "scheduledDate": "2026-10-20",
  "instructions": "Ficha fictícia para demonstrar o sistema.",
  "status": "published",
  "blocks": [
    {"name":"Aquecimento","instructions":"Caminhar confortavelmente.","durationMinutes":10},
    {"name":"Corrida","instructions":"Registrar esforço ao terminar.","durationMinutes":20,"distanceKm":2}
  ]
}
```

`status` aceita `draft`/`published`. Bloco aceita nome, instruções e campos opcionais `sets`, `repetitions`, `loadKg`, `durationMinutes`, `distanceKm`, `videoUrl` HTTPS. Ficha tem 1–50 blocos; URL não realiza upload nem faz o servidor baixar o conteúdo.

### Execução

`completedBlocks` usa índices iniciados em zero; são validados contra os blocos existentes. Consulte o catálogo antes de enviar métricas.

```json
{
  "completedBlocks": [0,1],
  "effort": 7,
  "notes": "Feedback fictício: concluí os dois blocos.",
  "metrics": {"durationMinutes":30,"distanceKm":2}
}
```

Esforço é inteiro de 1 a 10. Métrica desconhecida, não numérica, negativa ou fora dos limites retorna erro. Reenvio atualiza a mesma execução por ficha, sem aumentar a contagem de treinos concluídos.

## Exemplo PowerShell com cookies

Execute com a API ativa e o seed local aplicado; use somente credenciais de demonstração:

```powershell
$apiBase = 'http://localhost:3001/api'
$apiHeaders = @{ Origin = 'http://localhost:5173' }
$loginBody = @{ email = 'emailatleta@email.com'; password = 'senhaatleta' } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "$apiBase/auth/login" -Headers $apiHeaders -ContentType 'application/json' -Body $loginBody -SessionVariable atletaSession
Invoke-RestMethod -Uri "$apiBase/profiles/me" -WebSession $atletaSession
Invoke-RestMethod -Method Post -Uri "$apiBase/auth/logout" -Headers $apiHeaders -ContentType 'application/json' -Body '{}' -WebSession $atletaSession
```

Nenhuma operação financeira, upload, consulta oficial de CREF, integração wearable ou chat em tempo real é exposta por estes contratos. As pendências constam na [ERS](ERS-v1.1.md).
