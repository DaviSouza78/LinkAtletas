# Decisões, dificuldades e mudanças de escopo

Data: 14/10/2026. [Proposta aprovada por Lucca](../superpowers/specs/2026-10-14-expansao-completa-design.md). Este registro não atribui decisões ao professor ou a integrantes sem evidência.

| Decisão | Motivo e efeito |
|---|---|
| Preservar `sprint-2`, ampliar em `evolucao-completa` | Mantém entrega web inicial e permite revisar o novo incremento separadamente; migrations cumulativas preservam dados |
| Node/Fastify/PostgreSQL e React existentes | Evita reconstrução; app Expo compartilha API e contratos |
| Financeiro `academic` ou `asaas` explícito | Demonstração sem cobrança continua disponível e identificável; operação financeira exige credenciais reais no servidor |
| Asaas Checkout hospedado | Sem formulário próprio de cartão; webhook autenticado e único confirma evento, nunca redirect |
| Timeout financeiro vira resultado incerto | Evita repetir criação/cancelamento financeiro sem saber o resultado; conciliação por referência e estado persistido |
| Comissão em basis points, valores em centavos | Evita aritmética monetária baseada em texto; estimativa de participação difere de split liquidado |
| Um ciclo vigente por par | Encerrados/recusados podem gerar novo ciclo sem reapontar treinos antigos |
| S3 privado local SeaweedFS e SMTP Mailpit | Exercita serviços reais isolados sem depender de nuvem/contas nem enviar e-mail a terceiros |
| AES-256-GCM com chave fora do Git | Cifra conteúdo privado e mídia; chave precisa acompanhar backup por canal protegido e não pode ser regenerada para dados existentes |
| Recuperação com token no fragmento | Browser lê token sem enviá-lo na URL HTTP inicial; hash/expiração/uso único no banco e sessões invalidadas |
| CREF manual com prazo e auditoria | Não recebido contrato/API autorizada para consulta oficial; regex ou seed não substituem verificação |
| Review por ciclo e sete dias mínimos | Evita avaliações sem relação; parâmetro de teste não altera silenciosamente a regra padrão |
| WS depois do commit, histórico no banco | Mensagem não depende da memória do processo; fanout atual é de uma instância, broker futuro para distribuição |
| Agenda local primeiro, referência Google opcional | Persistência/conflitos independem de OAuth; criação externa somente por ação explícita; alterações locais ainda não sincronizam bidirecionalmente |
| Expo com token SecureStore | Cookie continua na web, token explícito no cliente nativo; bundle não é evidência de APK/IPA/dispositivo |
| IDs RF originais mantidos | ERS original detalha somente 24 RF; novos requisitos usam RF-A para evitar inventar RF-25–32 |

## Dificuldades e solução aplicada

Banco inicial tinha unicidade permanente do par atleta/treinador. A migração substitui por unicidade parcial de ciclo vigente e mantém os relacionamentos históricos. A coluna de correlação financeira ganhou migração aditiva de compatibilidade, evitando depender da reaplicação de migration já registrada.

Campos privados existentes estavam em JSON/texto legível. Helpers de criptografia e payload privado permitem migração/leitura sem apresentar hash de senha como se fosse cifra de métricas. A chave local é gerada em arquivo ignorado; produção exige configuração explícita. Perder a chave compromete a recuperação e deve ser prevenido no procedimento de backup.

Mensagens, mídia, agenda e cobranças precisam de autorização por vínculo em cada chamada. Foram mantidas validações de participante, papel, estado e origem; proteção não depende de esconder menus. Sessão WebSocket é revalidada e reconexão recupera histórico. Cobranças com estado incerto não recebem retentativa de criação indiscriminada.

Ambiente não forneceu conta Asaas, provedor oficial CREF, SMTP externo, S3 hospedado, domínio nem credenciais de lojas. Código e testes controlados avançam; ativação/homologação externa continuam pendentes. Java/Android SDK e Xcode não foram identificados no início; compilar/exportar JavaScript não permite afirmar execução nativa em dispositivo.

## Mudanças em relação à proposta original

Disponibilidade compõe nota e não é filtro rígido/reserva; a agenda de consultorias faz a reserva efetiva. Match usa regras explicáveis, sem IA treinada. Contratação inicia vínculo e depois checkout, em vez de pré-autorização de cartão antes do aceite. Documento profissional é opcional no formulário implementado, com texto/evidência obrigatórios; política de exigir documento real pode ser revisada antes da operação pública. Aprovação sem prazo informado usa validade padrão do servidor, visível no registro. Autosave contínuo, biblioteca pública de mídia e escala distribuída ainda não estão homologados.

## Publicação e participação

Na validação foram reproduzidas três disputas reais de bloqueio no PostgreSQL: edição de perfil aguardando conta eliminada, login aguardando troca de senha e correção aguardando arquivo eliminado. O servidor revalida a conta/arquivo dentro da transação e nega a operação que ficou obsoleta. Os [testes](../../tests/integration/privacy-races.test.ts) verificam que dados/sessões/feedback não reaparecem após a mudança. Consentimentos da web receberam estado visual imediato enquanto aguardam confirmação, preservando rollback de erro e verdade persistida no servidor.

O trabalho foi solicitado em clone local porque Lucca ainda não era contribuidor do repositório original. Não se presume permissão de push, merge ou publicação pública. Os commits usam a identidade fornecida por Lucca; não comprovam horas/revisão dos demais integrantes. Cada integrante precisa registrar sua participação e realizar sua entrega acadêmica conforme orientação do professor.
