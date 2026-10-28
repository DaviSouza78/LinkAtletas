# Auditoria técnica do servidor — 28/10/2026

## Escopo e método

Revisão do código TypeScript e SQL presente em `server/`: entradas, configuração, banco e seis migrações, funcionalidades, adaptadores, jobs, validação, erros, contratos de resposta e recursos de segurança. A leitura foi acompanhada por comparação dos consumidores, testes existentes, decomposição dos módulos maiores e regressões específicas.

O [README do servidor](../../../server/README.md) descreve cada arquivo da estrutura resultante. Esta é uma revisão técnica de código e funcionamento; não é um pentest, certificação de segurança ou garantia de ausência de defeitos. Nenhuma inspeção invasiva, migração ou teste destrutivo em produção faz parte desta auditoria.

Alterações locais anteriores foram preservadas antes da reorganização. As correções de elegibilidade em contratos e financeiro foram incorporadas ao escopo por tratarem de operações do servidor. O teste de navegação `roles.spec.ts` e o relatório anterior da auditoria ampliada continuam separados enquanto essa frente não for concluída.

## Áreas examinadas

| Área e arquivos | Conferência realizada | Resultado e limite |
|---|---|---|
| `app.ts`, `config.ts`, `index.ts` | Registro de rotas, origem, sessão, cookies/Bearer, configuração e dependências de produção. | Preservados os caminhos e o modelo de autenticação. Configuração privada continua fora do código. A revisão não mede a eficácia de limites distribuídos entre instâncias. |
| `runtime.ts`, `jobs.ts`, `scheduled.ts` | Inicialização, encerramento, static, intervalo, cron, autorização e trava. | Intervalo convencional passou a usar a mesma trava do endpoint agendado. O comando avulso `pnpm jobs` continua explícito e não deve ser usado concorrentemente sem necessidade. |
| `db/pool.ts`, `migrate.ts`, `seed.ts`, `admin.ts`, `init-test.sql` | Transação, falha de rollback, ordem/trava de migração, seed e criação administrativa. | Descarte da conexão corrigido. Não houve alteração no conteúdo das migrações existentes nem execução de seed na nuvem. |
| Migrações `001` a `006` | Chaves, restrições, índices, estados e evolução das tabelas. | Mantidas as versões aplicadas. Uma migração não é garantia de que toda regra de negócio seja imposta pelo banco. |
| `accounts/auth.ts`, `profiles.ts`, `verification.ts` | Login, sessão, edição própria, conferência manual e situação histórica/atual do CREF. | Sumário do login nativo corrigido para Bearer. Aprovação fictícia não comprova habilitação profissional real. |
| `training/matching.ts`, `contracts.ts`, `workouts.ts` | Compatibilidade, elegibilidade, decisão do vínculo, titularidade, publicação, métricas e execução. | Revalidação de conta/validade na solicitação e validade no aceite incorporadas; histórico e rascunhos preservados. |
| `interactions/*` | Mensagens, anexos, leitura, sessão de socket, destinatário, avaliações, moderação, agenda e conflitos. | Rotas separadas por assunto, com helpers compartilhados. WebSocket não é tratado como entrega garantida em serverless. |
| `media/routes.ts`, `uploads.ts` | Finalidade, tamanho, assinatura/MIME, cifra, titularidade, consentimento, upload parcelado e compensação. | Fluxos preservados. Há consumo de memória proporcional ao arquivo e não existe transação distribuída entre S3 e banco. |
| `privacy/routes.ts` | Recuperação, token, revogação de sessões, consentimentos, exportação e encerramento. | Preservadas as verificações existentes e as restrições financeiras. Retenção operacional, backups e combinações concorrentes adicionais continuam exigindo acompanhamento. |
| `billing/*` | Conta/vínculo, catálogo de planos, checkout, webhook, idempotência, assinatura, cancelamento, eventos e conciliação. | Planos e checkout passam a conferir conta ativa e aprovação vigente. Testes do adaptador são controlados; não equivalem a homologação Asaas. |
| `services/mail.ts`, `asaas.ts` | Fila cifrada, tentativas, liberação SMTP, timeout e validação relevante do provedor. | Transporte SMTP agora fecha mesmo com falha do banco. Limites e respostas reais dos fornecedores não foram homologados nesta revisão. |
| `shared/security.ts`, `crypto.ts`, `errors.ts`, `validation.ts`, `openapi.ts` | Hash, sessão/papel, cifra, mensagens, validações e efeito da serialização de respostas. | Preservados os mecanismos. OpenAPI continua tendo schemas genéricos em módulos ampliados; melhorar precisão é evolução documental, não prova de falha de permissão. |

## Correções

1. **Conexão após rollback falho:** o helper devolvia a conexão ao pool mesmo se o rollback falhasse e podia substituir a causa original. Agora descarta essa conexão e preserva o erro da operação. Quatro testes verificam sucesso, rollback normal, rollback falho e falha de commit/rollback.
2. **Sobreposição de jobs:** o intervalo convencional não usava a trava PostgreSQL aplicada pela rota do cron. Agora usa `runScheduledJobs`; a trava existente evita sobreposição entre esses caminhos. Não altera o intervalo da Vercel nem seu agendador externo.
3. **Transporte SMTP:** se a transação de leitura da fila falhasse, o fechamento do transporte podia ser pulado. Agora acontece em `finally`. Dois testes verificam fila vazia e falha do banco sem envio a terceiros.
4. **Profissional indisponível:** incorporadas as correções já preparadas para catálogo de planos, solicitação direta, aceite e checkout, impedindo operações novas com conta encerrada ou aprovação vencida conforme cada regra. Incluídos os testes de regressão e a matriz de autenticação/papel e titularidade por recurso.
5. **Descrição de autenticação:** o login nativo deixava entender que emitia cookie. O sumário agora descreve o Bearer token; o comportamento de autenticação não foi trocado.

## Organização aplicada

- Contas e habilitação em `modules/accounts`.
- Descoberta, vínculos e treino em `modules/training`.
- Arquivos e uploads em `modules/media`.
- Conta/privacidade em `modules/privacy`.
- Comunicação separada em registro, acesso, eventos, mensagens, notificações, avaliações e consultorias.
- Financeiro separado em rotas, tipos, configuração, validação, acesso, seleção de assinatura, eventos, ciclo e avisos.
- Entradas, serviços e recursos de banco mantidos em seus locais coerentes.
- Imports de consumidores e links da documentação atualizados. Contratos HTTP e nomes das tabelas preservados.

Antes da correção do texto do login nativo, o OpenAPI completo exportado antes/depois da separação era idêntico, com 63 caminhos. Essa comparação verifica a preservação do contrato documentado, não substitui regressão funcional. Os corpos das funções extraídas e os blocos de registro foram comparados com as fontes da reorganização; mudanças de comportamento descritas acima são identificadas separadamente.

## Verificações e resultados

O Docker Desktop local foi iniciado, mas seu daemon não respondeu no período de preparação. Isso impede considerar aprovada uma reexecução local com PostgreSQL/S3/SMTP. As suítes dependentes desses serviços devem ser verificadas pela CI isolada; o resultado da execução será referenciado após sua conclusão.

- Os testes específicos de transação e trava foram executados com dependências controladas e passaram antes da reorganização.
- Tipos e exportação OpenAPI foram executados após a separação dos módulos.
- Build e tipos da raiz, tipos móveis, 52 testes unitários e 22 testes móveis aprovados localmente. [Resultado unitário desta revisão](../evidencias/api/server-unit-2026-10-28.json).
- Integração, navegador e verificações completas: serão conferidos na CI do commit publicado; não são presumidos aprovados pela execução unitária.

## Limitações e acompanhamento

- Serviços externos podem falhar; operação gravada e notificação posterior não são uma transação única em todos os fluxos. Uma falha de notificação depois do commit pode exigir consulta do recurso antes de repetir a ação.
- Limitação de requisições é local à instância na configuração atual. Uma operação de produção com múltiplas instâncias pode exigir controle distribuído e monitoração próprios.
- Não há quota total de armazenamento por conta nem análise antimalware. Há limites por arquivo e por sessões ativas de upload; não confundir essas proteções.
- A finalidade profissional é verificada pelo administrador; nenhuma integração automática com conselho foi ativada.
- A política acadêmica não substitui a definição operacional de retenção, expiração de backups e monitoramento dos serviços.
- Modo financeiro continua acadêmico. Nenhum teste desta auditoria autoriza afirmar cobrança ou repasse real.
- Combinações concorrentes não cobertas pelos casos escritos, acessibilidade manual, aparelhos físicos e homologação dos provedores continuam fora da conclusão automática.

O relatório separa achados corrigidos de limites conhecidos. Ausência de falha nos cenários executados não transforma esses limites em itens concluídos.
