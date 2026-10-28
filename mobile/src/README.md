# Código do aplicativo

Cliente do atleta em React Native. [App.tsx](../App.tsx) restaura a sessão e escolhe a tela; cada tela usa os serviços HTTP da mesma API utilizada pela interface web.

Fluxo: **tela → serviço autenticado → API → estado React → componentes**. Contratos e catálogos independentes de plataforma vêm de [shared na raiz](../../shared/README.md).

| Área | Arquivos e responsabilidade |
|---|---|
| [screens](screens/README.md) | Telas organizadas em autenticação, início, perfil, vínculos, treinos, mensagens, agenda, avaliações, avisos, financeiro e privacidade. |
| [components](components/README.md) | Elementos visuais reutilizados e seletor de vínculo. |
| [hooks](hooks/README.md) | Consulta remota, execução de ações e assinatura dos eventos nativos. |
| [services](services/README.md) | Transporte HTTP, sessão segura, WebSocket e arquivos privados. |
| [config/api.ts](config/api.ts) | Interpreta URL/perfil/ambiente e retorna configuração ou erro de rede. Não contém segredos. |
| [utils/format.ts](utils/format.ts) | `money` e `datetime`: apresentação de moeda e data em português brasileiro. |
| [utils/forms.ts](utils/forms.ts) | `items` converte catálogos em opções; `number` interpreta entrada decimal com vírgula. A validação final pertence à API. |

Telas não devem importar banco, SMTP, S3 ou segredos do servidor. Componentes visuais não fazem autenticação. Novas chamadas devem usar o cliente central para preservar a política de sessão e o tratamento de erros.

Os arquivos foram separados preservando a lógica e os textos existentes. A fonte TypeScript não substitui um APK compilado: seguir os [comandos e limites de verificação](../README.md).

[Voltar ao aplicativo](../README.md)
