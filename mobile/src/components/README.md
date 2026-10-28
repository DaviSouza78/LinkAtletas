# Componentes compartilhados

| Arquivo | Função |
|---|---|
| [ui.tsx](ui.tsx) | Paleta, estilos e elementos comuns: títulos, textos, painéis, linhas, botões, campos, opções, carregamento, avisos e estados vazios. |
| [connections/ContractSelector.tsx](connections/ContractSelector.tsx) | Seleção de vínculo usada por mensagens, agenda e avaliações. Recebe dados e callbacks, sem consultar o banco. |
| [RemoteState.tsx](RemoteState.tsx) | Carregamento, erro e ação explícita de atualização dos dados. |
| [media/VerificationDocument.tsx](media/VerificationDocument.tsx) | Busca metadados e abre/compartilha documento profissional com autenticação; sem URL pública ou token na query. |

Componentes visuais recebem valores e ações pelas propriedades. A lógica de rede fica em serviços/hooks ou na tela responsável. Preservar rótulos de acessibilidade: eles também são usados no ensaio Android por UIAutomator.

Componentes exclusivos de uma funcionalidade ficam junto de sua tela; não é necessário criar uma pasta compartilhada para cada elemento pequeno.

[Código do aplicativo](../README.md)
