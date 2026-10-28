# Backlog priorizado — Sprint 2

Data: 14/10/2026. P0 = necessário ao fluxo; P1 = complemento; P2 = evolução. `Implementado` significa disponível no incremento; sua validação depende do [relatório](relatorio-testes.md). Itens parciais não encerram os requisitos originais. Atribuição do código não foi distribuída artificialmente entre os integrantes.

## Incremento da Sprint 2

| Item | Prioridade / RF | Critério de aceite | Estado |
|---|---|---|---|
| B01 Conta real e sessão | P0 / RF-01,02,05 | Cadastrar atleta/treinador; rejeitar e-mail repetido; autenticar, carregar sessão, sair; negar admin público | Implementado |
| B02 Perfil persistido | P0 / RF-01,02 | Salvar e recuperar esportes, objetivos, níveis, horários, modo, cidade e orçamento/preço | Implementado |
| B03 Conferência CREF | P0 / RF-03,04 | Pendência fora do catálogo; somente admin decide com razão e auditoria atômica | Implementado no recorte manual; RF parciais |
| B04 Match explicável e busca | P0 / RF-06,07,08 | Aprovação/modalidade/localidade filtram; nota 0–100 usa pesos fixos e explica critérios | Implementado; portfólio parcial |
| B05 Solicitar e decidir vínculo | P0 / RF-09,10 | Persistir pending; só destinatário aceita/recusa; impedir duplicação; carteira nasce do aceite | Implementado sem cobrança; RF-09 parcial |
| B06 Prescrição e publicação | P0 / RF-14 | Só treinador do vínculo ativo; rascunho privado; ficha e blocos persistidos | Implementado |
| B07 Consulta e execução | P0 / RF-16,17 | Atleta acessa somente suas publicadas; esforço 1–10 e métricas válidas; reenvio não duplica execução | Implementado |
| B08 Carteira e acompanhamento | P0 / RF-23 | Listar solicitações, vínculos e retornos reais; novas contas com estado vazio | Implementado no recorte; gestão avançada futura |
| B09 Banco e instalação | P0 / entregáveis | PostgreSQL 17, migrations repetíveis, volume persistente, seed explícito e banco de teste separado | Implementado; reprodução registrada em evidências |
| B10 Erros e segurança | P0 / RF-05, RNF-16 | Validar entrada, papel/propriedade, origem e sessão; mensagens sem senha/token | Implementado no recorte; auditoria de segurança completa futura |
| B11 Interface responsiva | P0 / RNF-09,10,11,13 | Fluxo operável em 390/1440 px; estados de espera/erro/vazio; sem overflow horizontal | Implementado; alcance de navegador conforme relatório |
| B12 Testes e evidências | P0 / entregáveis | Executar unidade/API/banco/navegador; salvar resultados reais e falhas encontradas | Concluído no recorte: 33 Vitest e 2 E2E aprovados, conforme relatório |
| B13 OpenAPI | P0 / RNF-14 | Swagger e JSON runtime documentam entrada, saída e erro das rotas do recorte | Implementado; conferir runtime |
| B14 ERS/diagramas/backlog | P0 / entregáveis | 24 RF, 16 RNF e 16 RN rastreáveis; cinco diagramas; limites explícitos | Documentado, alinhado às migrations/contratos; cinco PNG renderizados e inspecionados |
| B15 Decisões e dificuldades | P0 / entregáveis | Registrar aprovação, mudanças e soluções observadas sem inventar reunião/contribuição | Documentado |
| B16 URL de orientação | P1 / RF-15 | Campo opcional aceita somente referência HTTPS; não alegar upload | Implementado parcial |

## Pendências mantidas para evolução

| Item | Prioridade / RF ou RNF | Dependência / critério antes de encerrar |
|---|---|---|
| F01 App React Native | P1 / RNF-09,12 | Cliente nativo, instalação e homologação Android/iOS; web mobile não o substitui integralmente |
| F02 CREF automático e revogação | P1 / RF-04, RN-03 | Acesso oficial comprovado, contrato externo, falhas, expiração e nova avaliação |
| F03 Gateway e cartão | P1 / RF-11,12,13,24; RNF-05,15 | Escolher gateway, sandbox, tokenização, recorrência/split, webhooks idempotentes, reconciliação e carência |
| F04 Cancelamento | P1 / RF-22 | Definir vigência, estorno, cobrança e encerramento; integração com gateway |
| F05 Mídia S3 | P1 / RF-03,15,18 | Upload privado, limites, retenção, consentimento e autorização de reprodução |
| F06 Mensagens em tempo real | P1 / RF-19 | Persistência entre contas, canal autenticado, entrega, histórico e moderação |
| F07 Avaliações/respostas | P2 / RF-20,21; RN-13 | Período mínimo definido, elegibilidade, autoria e moderação |
| F08 Governança de dados | P0 antes de uso real / RNF-01,02; RN-14,15 | Consentimento/finalidade, revogação/exclusão, retenção e criptografia em trânsito/repouso |
| F09 Infraestrutura de produção | P1 / RNF-08 | TLS, segredos, backups/restauração, métricas, balanceamento e escala com carga real |
| F10 Match avançado e métricas | P2 / RF-06; RN-10; RNF-07 | Avaliação com base representativa, interações e gestão administrativa de catálogo; evitar alegação de IA sem evidência |
| F11 Usabilidade e compatibilidade | P1 / RNF-09,10,13 | Homologar Firefox/Edge/Safari, teclado, leitor de tela e zoom; autosave periódico se mantido na ERS final |
| F12 Evolução acadêmica | P1 / Sprint 3 | ERS final, testes ampliados, manual implantação, apresentação Mostra e evidências individuais reais |

Nenhum requisito foi apagado para aparentar conclusão. Wearables e marketplace de produtos continuam fora do MVP conforme proposta inicial. RF-25–32 são referências não especificadas no cronograma original, a esclarecer com a equipe antes de entrar no backlog com identificadores definitivos.
