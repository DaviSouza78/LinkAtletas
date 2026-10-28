# Transporte e sessão

[api.ts](api.ts) centraliza a comunicação nativa com o servidor.

| Grupo | Elementos principais |
|---|---|
| Configuração | `API_URL`, `API_CONFIGURATION_ERROR` e `LOCAL_DEMO`, derivados da configuração pública do build. |
| Sessão | `authenticate`, `loadSession`, `forgetSession`, `logout` e `onSessionExpired`; token opaco no SecureStore. |
| HTTP | `api` e `ApiError`; JSON, Bearer no cabeçalho, tempo limite e mensagens de erro. |
| Arquivos | `upload`, `shareMedia`, `shareExport` e tipo `Media`; envio, leitura autorizada e compartilhamento explícito. |
| Eventos | `connectEvents`; WebSocket autenticado por cabeçalho nativo, sem token na URL. |

O módulo usa [config/api.ts](../config/api.ts) para bloquear destinos incompatíveis com o perfil. Variáveis `EXPO_PUBLIC_*` entram no aplicativo e não podem conter segredos. Senha, credenciais S3/SMTP e chave AES não são persistidas pelo cliente.

Downloads/exportações podem criar cópias no cache privado para abrir o compartilhamento do sistema; o módulo tenta removê-las após a operação. Uma cópia enviada a outro aplicativo passa a depender desse destino.

Os [testes de transporte](../../tests/api.test.ts) controlam os módulos nativos e o HTTP; não comprovam acesso real a um aparelho, ao provedor de e-mail ou ao armazenamento em nuvem.

[Código do aplicativo](../README.md)
