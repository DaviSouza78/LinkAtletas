# Integrações externas

Adaptadores usados pelo servidor para conversar com provedores. As regras e permissões das operações ficam nos [módulos](../modules/README.md).

| Arquivo | Função |
|---|---|
| [mail.ts](mail.ts) | Enfileira e-mails com corpo cifrado e entrega os pendentes por SMTP, com tentativas e intervalo entre falhas. Fecha o transporte ao terminar. |
| [asaas.ts](asaas.ts) | Cria checkout, consulta e solicita cancelamentos financeiros, tratando timeout, respostas inválidas e resultados incertos. |

E-mail usa Brevo na nuvem e Mailpit localmente. O financeiro permanece em modo acadêmico; o adaptador implementado não comprova homologação nem cobrança real. Endpoints alternativos do Asaas são restritos a loopback para testes controlados.

Configuração vem das variáveis do servidor. Não registrar credenciais, tokens ou corpos privados nos logs. Aceite SMTP não garante chegada à caixa de entrada; resposta financeira incerta exige conciliação antes de repetir uma operação.

[Voltar ao servidor](../README.md) · [Serviços utilizados](../../docs/operacao/servicos-externos.md)
