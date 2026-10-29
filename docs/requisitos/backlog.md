# Backlog do projeto

Estados de implementação e validações têm alcances diferentes. Resultados estão no [relatório de testes](../evidencias/relatorio-testes.md); o [guia de serviços](../operacao/servicos-externos.md) descreve as dependências externas. A [ERS oficial](ERS-LinkAtletas.pdf) define os requisitos.

| Item | Prioridade | Resultado da ampliação | Verificação/dependência |
|---|---|---|---|
| F01 App React Native por perfil | P1 | Interfaces de atleta, treinador e administrador e API compartilhada | Consultar a [matriz móvel](../../mobile/docs/equivalencia-web-mobile.md) para implementação, verificações e limites; homologação física, OAuth real e lojas têm validação própria |
| F02 CREF, validade e revogação | P0 | Conferência manual, evidência privada, prazo, suspensão/revogação e job | Fluxo manual e auditoria testados; decisão da equipe registrada na ERS; consulta automática é evolução futura |
| F03 Recorrência/split/financeiro | P1 | Adaptador Asaas e regras persistidas, checkout, webhook e conciliação | Servidor HTTP controlado; sandbox real/carteiras/repasse pendentes |
| F04 Cancelamento e ciclos | P1 | Retirada, encerramento e período pago, unicidade de ciclo vigente | Testes financeiro/contrato e tela; preservar histórico |
| F05 Upload S3 e correção | P1 | S3 privado, cifra, assinatura MIME/extensão, finalidade, consentimento e feedback | Tigris integrado; envio em partes e recuperação de 5/50 MiB com hash, Range e permissões verificados em Preview; armazenamento privado também testado em produção |
| F06 Chat/notificações | P1 | WS autenticado, histórico paginado/cifrado, leitura e notificações persistidas | Testes duas sessões/isolações/persistência; broker multi-instância futuro |
| F07 Reviews/respostas/moderação | P1 | Período mínimo de sete dias, uma por ciclo, edição/resposta, denúncia/ocultação | Testes interação; não gerar reputação fictícia |
| F08 Privacidade/recuperação | P0 | Consentimento versionado, saúde cifrada, exportação/exclusão e SMTP/outbox/reset | Testes locais e recuperação remota com Brevo/SMTP aceito; token único e revogação de sessão verificados. Chegada à caixa de entrada e política jurídica operacional têm validação própria |
| F09 Implantação/recuperação | P1 | Containers/TLS/backup/CI, Vercel, Neon e agendador | Produção pública verificada, cron automático com 200 OK e snapshot cifrado Neon restaurado em banco local isolado. Backup SQL/S3 local testado; rotina recorrente de backup permanece evolução |
| F10 Match e ciência de dados | P0 no matching RF-06; P2 na evolução de IA | Regra explicável e carga HTTP com 500 perfis/200 chamadas | Percentis medidos; dataset representativo, retroalimentação e IA treinada futuros. Prioridade não comprova homologação externa |
| F11 Compatibilidade/acessibilidade | P1 | Web responsiva e correções de foco/estados; três motores e axe | 15/15 E2E e seis telas por motor sem violações axe; aparelhos/Edge/Safari/leitor de tela reais pendentes |
| A01 Agenda/consultorias | P1 | Persistência, conflitos, histórico, reagendamento/cancelamento/conclusão | Google OAuth real não executado; sincronização bidirecional externa futura |
| A02 Catálogo ampliado | P2 | Métricas dinâmicas dos esportes atuais preservadas | Administração de novas modalidades e migração sem código futuro |
| A03 Edição com autosave | P2 | Rascunho explícito preservado | Autosave contínuo e conflito colaborativo futuro |

## Itens retirados ou substituídos com justificativa

- Reconstruir o backend ou migrar o banco para MySQL foi descartado neste incremento: mantém-se API Node/PostgreSQL já integrada.
- Pagamento fictício apresentado como aprovado foi descartado: modo acadêmico diz sem cobrança, adaptador não configurado não produz sucesso externo.
- Consulta CREF por regex/seed não é aceita como validação oficial; substituída por conferência manual rastreável até receber serviço autorizado.
- Telas ilustrativas antigas com dados mock, sem importação pela aplicação integrada, foram retiradas da versão atual e permanecem recuperáveis no histórico Git. As páginas em uso consomem dados persistidos.
- Captura própria de cartão foi substituída por checkout hospedado. Pré-autorização anterior ao aceite, quando citada no texto original, não é a sequência atual: o treinador aceita o ciclo antes da intenção financeira.

## Evolução após a entrega

Homologar contas/serviços externos, dispositivos e operação pública; definir política de retenção adequada à operação; executar avaliação de usabilidade/leitor de tela com pessoas; validar dataset de matching e ajustes estatísticos; adicionar broker distribuído e medir escala em ambiente real; sincronizar eventos Google também em alteração/cancelamento; administrar modalidades e rascunhos automáticos. Cada evolução exige critério de aceite e evidência próprios, preservando os identificadores históricos.
