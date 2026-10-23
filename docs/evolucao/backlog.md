# Backlog consolidado — ampliação

Revisado em 20/10/2026. Base: [backlog histórico](../sprint-2/backlog.md). Estados separam desenvolvimento de homologação; resultado executado está no [relatório](relatorio-testes.md). [Revisão dos materiais](revisao-materiais.md) e [dependências externas](servicos-externos-sprint-2.md) registram diferenças em relação à proposta/ERS originais. Não é planejamento de contribuições presumidas de colegas.

| Item | Prioridade | Resultado da ampliação | Verificação/dependência |
|---|---|---|---|
| F01 App atleta React Native | P1 | Fonte Expo, API compartilhada, armazenamento seguro e perfil de APK local | APK Android compilado e inicializado em emulador; testes de transporte/configuração atualizados para 21. Ensaios integrados têm resultado próprio no relatório; aparelho físico, IPA e lojas não são presumidos |
| F02 CREF, validade e revogação | P0 | Documento privado, prazo, suspensão/revogação e job | Testes plataforma; consulta oficial automatizada depende contrato/acesso |
| F03 Recorrência/split/financeiro | P1 | Adaptador Asaas e regras persistidas, checkout, webhook e conciliação | Servidor HTTP controlado; sandbox real/carteiras/repasse pendentes |
| F04 Cancelamento e ciclos | P1 | Retirada, encerramento e período pago, unicidade de ciclo vigente | Testes financeiro/contrato e tela; preservar histórico |
| F05 Upload S3 e correção | P1 | S3 privado, cifra, assinatura MIME/extensão, finalidade, consentimento e feedback | Testes S3 local/SQL; nuvem depende configuração |
| F06 Chat/notificações | P1 | WS autenticado, histórico paginado/cifrado, leitura e notificações persistidas | Testes duas sessões/isolações/persistência; broker multi-instância futuro |
| F07 Reviews/respostas/moderação | P1 | Período mínimo de sete dias, uma por ciclo, edição/resposta, denúncia/ocultação | Testes interação; não gerar reputação fictícia |
| F08 Privacidade/recuperação | P0 | Consentimento versionado, saúde cifrada, exportação/exclusão e SMTP/outbox/reset | Testes SMTP Mailpit e autorização; política jurídica operacional futura |
| F09 Implantação/recuperação | P1 | Containers/TLS/backup/CI e scripts | TLS 1.3, reinício da aplicação, restauração SQL/S3 e CI executados com aprovação; [registros de publicação](publicacao.md). Docker local recuperado sem apagar volumes; publicação pública requer acessos |
| F10 Match e ciência de dados | P2 | Regra explicável e carga HTTP com 500 perfis/200 chamadas | Percentis medidos; dataset representativo, retroalimentação e IA treinada futuros |
| F11 Compatibilidade/acessibilidade | P1 | Web responsiva e correções de foco/estados; três motores e axe | 15/15 E2E e seis telas por motor sem violações axe; aparelhos/Edge/Safari/leitor de tela reais pendentes |
| F12 Documentação acadêmica | P0 | ERSv2, fluxos, modelos UML, checklist, API/manual/matriz | DOCX/PDF gerados, validados/renderizados; Eletiva I identificada e relacionada na matriz em 23/10/2026; revisão docente e entrega individual pendentes |
| A01 Agenda/consultorias | P1 | Persistência, conflitos, histórico, reagendamento/cancelamento/conclusão | Google OAuth real não executado; sincronização bidirecional externa futura |
| A02 Catálogo ampliado | P2 | Métricas dinâmicas dos esportes atuais preservadas | Administração de novas modalidades e migração sem código futuro |
| A03 Edição com autosave | P2 | Rascunho explícito preservado | Autosave contínuo e conflito colaborativo futuro |

## Itens retirados ou substituídos com justificativa

- Reconstruir o backend ou migrar o banco para MySQL foi descartado neste incremento: mantém-se API Node/PostgreSQL já integrada.
- Pagamento fictício apresentado como aprovado foi descartado: modo acadêmico diz sem cobrança, adaptador não configurado não produz sucesso externo.
- Consulta CREF por regex/seed não é aceita como validação oficial; substituída por conferência manual rastreável até receber serviço autorizado.
- Telas ilustrativas antigas com dados mock permanecem como referência histórica em arquivos não usados nas rotas integradas. As novas páginas consomem dados persistidos.
- Captura própria de cartão foi substituída por checkout hospedado. Pré-autorização anterior ao aceite, quando citada no texto original, não é a sequência atual: o treinador aceita o ciclo antes da intenção financeira.

## Evolução após a entrega

Homologar contas/serviços externos, dispositivos e operação pública; definir política de retenção adequada à operação; executar avaliação de usabilidade/leitor de tela com pessoas; validar dataset de matching e ajustes estatísticos; adicionar broker distribuído e medir escala em ambiente real; sincronizar eventos Google também em alteração/cancelamento; administrar modalidades e rascunhos automáticos. Cada evolução exige critério de aceite e evidência próprios, preservando os identificadores históricos.
