# Financeiro

**A demonstração usa modo acadêmico, sem cobrança real.** O adaptador Asaas só opera com configuração própria; os testes controlados não equivalem a homologação externa.

| Arquivo | Função |
|---|---|
| [routes.ts](routes.ts) | Rotas de configuração, plano, carteira, checkout, resumo, cancelamento, webhook e administração. |
| [types.ts](types.ts) | Tipos internos de conexão e opções do provedor. |
| [configuration.ts](configuration.ts) | Modo, ambiente, disponibilidade e criação do adaptador configurado. |
| [validation.ts](validation.ts) | Schemas, autenticação do webhook, datas e período mensal. |
| [access.ts](access.ts) | Vínculo, contas, validade profissional e acesso financeiro quando aplicável. |
| [subscriptions.ts](subscriptions.ts) | Seleção das assinaturas e consulta restrita aos participantes. |
| [events.ts](events.ts) | Processamento dos eventos persistidos, correlação e atualização dos pagamentos/estados. |
| [lifecycle.ts](lifecycle.ts) | Expiração, carência, conciliação e cancelamento. |
| [notifications.ts](notifications.ts) | Registro dos avisos financeiros aos participantes. |

Fluxo externo previsto: **plano/carteira → intenção única por ciclo → checkout → webhook autenticado → atualização e conciliação**. A requisição externa pode ter resultado incerto; não repetir automaticamente uma cobrança sem conferir sua situação.

Estados: `awaiting_payment` (aguarda pagamento), `regular` (regular), `grace` (carência), `suspended` (suspenso), `cancellation_requested` (cancelamento solicitado), `ended` (encerrado) e `uncertain` (resultado a conciliar). São estados da assinatura; o vínculo possui seus próprios estados.

Cancelamento solicitado não significa confirmação do provedor. A vigência paga é preservada conforme o fluxo. Valores em `amountCents` estão em centavos; comissão em `commissionBps` usa pontos-base, sendo 100 igual a 1%. Participações calculadas não comprovam repasse bancário.

As tabelas desta área têm prefixo `billing_`. Credenciais ficam no servidor; o cliente recebe somente a configuração pública prevista. Checkout exige conta ativa e aprovação profissional vigente.

[Módulos](../README.md) · [Adaptador Asaas](../../services/asaas.ts) · [Testes financeiros](../../../tests/integration/billing.test.ts)
