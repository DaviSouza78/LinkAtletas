# Correções aplicadas à ERS — 24/10/2026

Registro histórico da aplicação da versão 2.4. A [versão 2.5](ajustes-ers-v2.5.md) remove o detalhamento 5.4.1 e a lista final de relatórios acrescentados, ajusta espaçamento e substitui a tentativa de conversão do Word por uma reconstrução com texto editável posicionado.

Versão 2.4. Responsável: Lucca Castilho Costa. Aplicação autorizada pela equipe após a [auditoria de 24/10](auditoria-ers-2026-10-24.md). Este registro atualiza a situação dos apontamentos; a auditoria anterior permanece histórica, com as páginas e o hash do documento então analisado.

Documento principal: [ERS no template original](ERS-template-original-atualizada.pdf). Fontes: [texto repaginado](ERS-template-original.md), [campos das páginas iniciais](template/primeiras-paginas.json), [32 RF completos](template/requisitos.json), [seções e histórico](template/secoes.json), [16 casos de teste](template/testes.json) e [síntese auxiliar v2.4](ERS-v2.md).

## Estrutura e apresentação

| Apontamento | Aplicação |
|---|---|
| E01 | RF-01–24 e RF-A01–A08 integrados à seção 2.1; 16 RNF na 2.2 e 16 RN na 2.3. Retirada a segunda especificação dos apêndices |
| E02 | Seção 6 desenvolvida com CT001–CT016: objetivo, rastreabilidade, pré-condições/entradas fictícias, passos, esperado, observado, data/ambiente e evidência. Correspondência de cada resultado validada no JSON preservado |
| E03 | Títulos 6 e 7 em preto; título 7 somente no corpo e na referência normal do sumário, sem continuações repetidas |
| E04 | Sumário recalculado, com capítulos 1–7, seção 2 e subdivisões. Links internos e marcadores apontam às posições físicas do PDF, incluindo a capa |
| E05 | Casos, classes, sequências e DER numerados em 5.1–5.4; processos de contratação e treino associados aos RF efetivos |
| E06 | Três capturas reais e cinco figuras atuais incorporadas. SVGs convertidos pelo Chromium para preservar estilos e vetores; hashes conferem fonte e figura. DER com detalhamento legível de 35 entidades e 45 FKs, além da visão geral ampliável |
| E07 | Capa, identificação e autoria da Sprint 1 preservadas. Não se inventou grafia ou nome completo diferente para integrantes; autoria original continua coletiva |
| E08 | Corpo refluído com as fontes e tamanhos do template; eliminadas as junções e frases truncadas apontadas. Corrigidos os parágrafos iniciais sobre escopo, tecnologia e CREF |
| E09 | Texto inserido conferido por extração, linhas dentro das margens e links. Mapeamento Unicode normalizado para pesquisa/cópia de espaços, hífens e ponto e vírgula, sem alterar o desenho das fontes |
| E10 | Histórico 1.0–2.4 preservado com data, versão, descrição e autor. PDF, fonte auxiliar, Word e cópias locais sincronizados |

## Escopo e planejamento

| Apontamento | Aplicação |
|---|---|
| G01 | Descritos web para três papéis, app do atleta, API e PostgreSQL. Modo acadêmico local separado de cobrança real e nuvem pendentes |
| G02 | Monetização e quatro planos históricos identificados como proposta de evolução; não são limites comerciais implementados |
| G03 | Estimativas preservadas e qualificadas: R$ 7.018,00 iniciais, R$ 1.025,00 mensais e 408 horas × R$ 16,00. Não são contratação, pagamento ou pesquisa atual de preços |
| G04 | Cronograma usa RF-01–24 e RF-A01–A08. Não atribui conteúdo aos antigos RF-25–32 não especificados |
| G05 | Calendário harmonizado: Sprint 1 03/08–14/09, Sprint 2 21/09–26/10 e Sprint 3 09/11–30/11/2026 |
| G06 | Elicitação documental e discussão/prototipação descritas; Stitch identificado como concepção histórica. Não se inventam entrevistas nem atividade comprovada no Figma |
| G07 | Capturas integradas de administração, atleta e treinador distinguem implementação de prototipação histórica; fontes e evidências vinculadas |
| G08 | Prioridade separada do estado e da dependência externa. RF-06 e matching do item F10 são P0; IA treinada continua evolução P2 |

## Conteúdo técnico conferido

- [x] RF-01–05: conta versus perfil, campos reais, CREF/evidência obrigatórios, documento opcional, motivo administrativo distinto, validade administrativa padrão de 365 dias, papéis e sessões web/app.
- [x] RF-06–10: pesos 30/20/25/25, filtros de modalidade/cidade/atendimento, ausência de filtro por rating, dados públicos, solicitação/aceite antes do checkout e ciclos históricos.
- [x] RF-11–13 e RF-24: adaptador, intenção, webhook, carência, conciliação e checkout hospedado; nenhum repasse bancário, idempotência do provedor ou homologação real presumidos.
- [x] RF-14–18: rascunho explícito, publicação, catálogo de métricas, execução única editável, esforço 1–10, mídia ligada ao recurso, seletor de arquivos, tipos/limites e consentimento; sem prometer câmera própria ou upload retomável.
- [x] RF-19–23: notificações internas, mensagens persistidas, avaliação em vínculo ativo elegível por sete dias, resposta/moderação, encerramento por participante e histórico preservado.
- [x] RF-A01–A08: recuperação SMTP, notificações, agenda, privacidade, validade profissional, app, operação e moderação integrados ao corpo.
- [x] RNF-01–05: finalidades separadas, privacidade, cifra dos conteúdos privados, TLS versus HTTP local restrito, auditoria e filtro no servidor, checkout sem certificação PCI presumida.
- [x] RNF-06–10: p95 no cenário sintético sem cache, catálogo atual, escala futura, acessibilidade com limites e rascunho mensurável.
- [x] RNF-11–16: estados de envio sem porcentagem presumida, Android API 35, limites de iOS/aparelhos/engines, REST/OpenAPI, unicidade/locks locais, jobs agendáveis e logs sanitizados com alcance declarado.
- [x] RN-01–16: decisões manuais, validade/suspensão, financeiro condicional, cálculo determinístico, consentimentos, autorização, métricas e avaliação harmonizados com os RF/RNF.

## Verificações e limites

A [verificação reproduzível](evidencias/ers-template-verificacao.json) registra hashes, sumário, figuras, margens, fontes/tamanhos do corpo e a correspondência dos 16 casos com resultados aprovados. As 13 páginas iniciais são comparadas visualmente à fonte fora das áreas autorizadas; o restante é repaginado para corrigir o conteúdo. A seção de siglas preserva também a continuação da tabela original. O PDF original permanece com SHA-256 `b49d79d04aa8af4ef8762076d417c5cef67b1d5004171c7ff73996111fe42752`.

O volume final não foi limitado artificialmente a 47 ou 61 páginas: acrescentaram-se os oito RF-A no corpo, fluxos completos, testes detalhados e a leitura do modelo físico; foram retiradas as 14 páginas de apêndices duplicados. Nenhuma fonte foi reduzida para ajustar contagem.

Os testes históricos preservam suas datas, ambientes e limites. Esta revisão executa geração, extração, rastreabilidade, validação de documentos e inspeção visual; não declara nova execução dos 82 testes de aplicação, 15 E2E, 22 móveis ou 18 etapas do APK. CT002 identifica o cadastro do treinador como preparação da suíte e não inventa um ensaio independente de cadastro pela interface. Dados de CREF são fictícios; o teste comprova o fluxo administrativo, não consulta real ao conselho.

O documento está consolidado para a revisão e entrega da equipe. Permanecem tarefas operacionais distintas: implantação em nuvem, homologações externas que a equipe decidir ativar, revisão coletiva e submissões individuais. Não há pendência criada de autorização docente para o CREF manual. A presente revisão não modifica o código da aplicação nem o conteúdo da release histórica.
