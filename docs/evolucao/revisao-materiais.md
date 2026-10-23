# Revisão dos materiais do grupo

Revisão de 15/10/2026. Os oito arquivos da pasta `C:/Users/user/Downloads/integrador` foram inventariados; sete são conteúdos únicos. Os originais foram preservados. As correções desta revisão estão nos documentos atuais, código e modelos do repositório; não alteram retroativamente a entrega da Sprint 1 nem representam aprovação docente.

## Fontes conferidas

| Material recebido | Conteúdo e conclusão |
|---|---|
| `Roteiro_Projeto_Integrador_Interdisciplinar_II_2026.pdf` | 13 páginas. Sprint 2: 21/09–26/10/2026; demonstração real em 26/10 e os nove entregáveis da seção 9.6. O roteiro recomenda reduzir dependências indisponíveis e registrar decisões. Nuvem, quando prevista, precisa de evidência compatível; não foi descartada como obrigação curricular. |
| `LinkAtletas_Documento_ERS_2026.pdf` | 47 páginas. Foram confrontados requisitos, regras, escopo, modelos e cronograma com a implementação e ERS atual. O planejamento original inicia a Sprint 2 em 14/09, enquanto o roteiro oficial a inicia em 21/09; mantém-se o prazo comum de 26/10. O texto original também cita RF-25–32 sem especificá-los; os requisitos novos da revisão usam RF-A. |
| `ANEXO_A_PROPOSTA_INICIAL_DEMANDA - LinkAtletas.pdf` | Quatro páginas. Identifica demanda SAGA 12871, Ivi-it/SC, seis integrantes, consulta em 09/08/2026 e captura de tela na página 1. A imagem é evidência histórica da seleção; não foi apresentada como nova consulta ao status atual. A página 4 admite risco de API CREF indisponível e alternativa manual/parceria. |
| `ANEXO_A_PROPOSTA_INICIAL_DEMANDA - LinkAtletas (1).pdf` | Duplicata byte a byte do arquivo anterior, com SHA-256 idêntico. Não representa uma segunda versão da proposta. |
| `convivencia.pdf` | Uma página. Reforça entrega no prazo e a necessidade de anexar **e efetivamente entregar** no Classroom; não basta anexar. Nenhuma submissão foi realizada automaticamente. |
| `PO-UNI-107-2026.pdf` | Duas páginas. Composição informada: 55% avaliação docente, 35% Projeto Integrador e 10% autoavaliação a partir do segundo semestre de 2026. O documento não define nota desta entrega nem comprova participação individual. |
| `Template_ResumoExpandido2026.6bced2c68d504ba99fc5_v2.docx` | Modelo de resumo expandido: 3–5 páginas, Arial 12, texto justificado, título em português/inglês, resumo/abstract, introdução, metodologia, resultados, conclusão e referências. Contém exemplos e campos de autores; não é artigo preenchido do grupo. Não inventar titulação, foto, pesquisa com pessoas, aprovação ou resultados. Não consta como um dos nove entregáveis gerais da Sprint 2. |
| `Templatebanner_CongressoUniSENAISP.9692b0e8e652479a8d71.pptx` | Modelo de banner com textos de exemplo e identificação de autores. Não é apresentação final do LinkAtletas. Deve ser preenchido/revisado quando exigido para a Mostra/evento; não substitui a demonstração executável da Sprint 2. |

Inventário com hashes e contagem de páginas/partes: [materiais-originais.json](evidencias/materiais-originais.json). Texto extraído de assinaturas e informações pessoais desnecessárias não foi reproduzido neste relatório.

## Inconsistências corrigidas ou explicitadas

- [x] **Publicação e CI desatualizadas no backlog:** substituir indicação de “não executada” pelos registros reais do GitHub.
- [x] **APK e homologação confundidos:** distinguir bundle, compilação, inicialização, ensaio integrado em emulador, aparelho físico e distribuição em loja. Cada estado exige sua própria evidência.
- [x] **DER incompleto:** o banco possui 36 tabelas, 257 colunas e 45 FKs. Foram incluídas relações ausentes e corrigidas referências opcionais e cardinalidades conforme o catálogo do PostgreSQL. O [dicionário](dicionario-dados.md) lista todas as colunas, restrições e índices, incluindo a unicidade parcial de vínculo vigente.
- [x] **Documento profissional no modelo de classes:** a mesma mídia pode ser referenciada por várias submissões de verificação; corrigida a cardinalidade. A propriedade do arquivo e as regras de acesso continuam verificadas pela API.
- [x] **Classes conceituais versus código:** o modelo conceitual não é apresentado como ORM. As classes reais `AsaasClient`/`AsaasError` ilustram encapsulamento e especialização no adaptador; o domínio usa contratos TypeScript e SQL explícito.
- [x] **Chamadas de sequência ambíguas:** explicitar os endpoints de consentimento, mídia e mensagens. O verificador documental confere métodos/rotas dos diagramas contra o OpenAPI e atributos/FKs contra o snapshot do banco.
- [x] **Falhas de arquivos privados no app:** colocar download/gravação dentro de `try/finally`, garantir limpeza de cópias parciais e impedir download com configuração de produção inválida. Regressões em [api.test.ts](../../mobile/tests/api.test.ts).
- [x] **APK anterior sem backend acessível:** perfil local explícito, pacote Android separado e conexão por `adb reverse`; produção mantém HTTPS. Novos testes de [configuração](../../mobile/tests/config.test.ts) recusam domínio documental, credenciais embutidas e destino HTTP externo no perfil local.
- [x] **Compatibilidade Expo:** atualizar a correção do SDK de 57.0.29 para 57.0.30, conforme a versão exigida pelo CLI, mantendo os demais módulos compatíveis e versões fixadas no lockfile.
- [x] **Ambiente Windows:** recuperar Docker preservando diretórios de sockets antigos, volumes e chaves; remover a opção `RUNASADMIN` do `cmd.exe` no perfil do usuário, com backup do valor anterior, para restaurar os comandos pnpm sem elevação.

## Diferenças de escopo que precisam continuar visíveis

| Assunto | Texto anterior | Versão implementada e tratamento |
|---|---|---|
| CREF | A ERS original planejou automação na Sprint 2 | Conferência manual com auditoria, validade e suspensão. Atualização de 23/10: a equipe informou aceite do professor; RF-04, UC-02 e RN-02 adequados na ERS v2.2. Automação é evolução futura; não foi localizada API pública documentada adequada à integração. |
| Banco | Proposta/ERS mencionam MySQL e PostgreSQL simultaneamente | PostgreSQL único; migrations, transações, índices e backup testados. Evita duplicar persistência sem necessidade demonstrada. |
| IA | A proposta classifica recomendação mais sofisticada como obrigatória | Match determinístico e explicável; não há modelo treinado, dataset representativo ou validação de eficácia. Registrar como redução/evolução a validar, nunca como IA concluída. O roteiro exige dados/métricas para justificar IA. |
| Pagamento | Pré-autorização/recorrência/split no escopo completo | Aceite do ciclo antes do checkout; modo acadêmico sem cobrança e adaptador Asaas com testes HTTP controlados. Homologação financeira real continua aberta. |
| Android/iOS e lojas | Compatibilidade e instalação pelas lojas na ERS original | APK Android local e ensaio em emulador são evidências próprias; iOS, hardware e stores não são presumidos pelos bundles. Confirmar o recorte da próxima entrega. |
| Nuvem | Hospedagem/armazenamento em nuvem previstos | Arquitetura, containers, TLS, S3 local e CI em runner de nuvem verificáveis. Não existe URL pública do produto; alinhar a evidência exigida pelo docente. |
| Disponibilidade e rascunhos | Texto anterior prevê regras mais amplas | Horários compõem afinidade, agenda reserva consultorias; rascunho é salvo por ação explícita. Autosave contínuo e sincronização Google bidirecional permanecem no backlog. |

## Pendências que não podem ser preenchidas por suposição

- [x] Contribuição da Eletiva I e evidências relacionadas na [matriz](rastreabilidade.md).
- [x] Registrar na ERS v2.2 o aceite do CREF manual informado pela equipe.
- [ ] Alinhar os demais ajustes de escopo e o recorte de serviços externos/compatibilidade nesta Sprint.
- [ ] Registro da participação efetiva de cada integrante, com contribuição verificável; não atribuir os commits de Lucca aos colegas.
- [ ] Entrega individual no ambiente acadêmico, conferindo anexos e confirmação de envio.
- [ ] Contas e acessos externos que o grupo escolher homologar; ver [checklist específico](servicos-externos-sprint-2.md).

Resultados técnicos e limitações executadas ficam no [relatório de testes](relatorio-testes.md), na [verificação do app](evidencias/mobile-verificacao.md) e no [checklist da Sprint 2](checklist-sprint-2.md).
