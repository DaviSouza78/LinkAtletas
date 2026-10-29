# Ensaios de infraestrutura

| Arquivo | Comando | O que verifica e modifica |
|---|---|---|
| [load-matching.ts](load-matching.ts) | `pnpm test:load` | Migra e limpa banco `_load_test`, cria 500 treinadores e um atleta, aquece API e mede 200 consultas com concorrência 10. |
| [verify-backup.ts](verify-backup.ts) | `pnpm test:backup` | Cria bancos/buckets exclusivos, persiste campo privado e mídia fictícios, faz backup/restauração e compara contagens, hashes e decifragem. |
| [verify-private-backup.ts](verify-private-backup.ts) | `pnpm exec tsx scripts/verificacao/verify-private-backup.ts` | Verifica backup por worker S3 na rede Docker privada. Insere objeto fictício, para a aplicação no snapshot e tenta reativá-la ao terminar. |
| [verify-tls.ts](verify-tls.ts) | `pnpm test:tls` | Verifica CA, HTTPS, interface, banco, cookie, recusa sem Origin e persistência de sessão/perfil após reiniciar contêiner. |
| [smoke-server.ts](smoke-server.ts) | `pnpm test:smoke` | Alias que importa `verify-tls.ts`; executa o mesmo ensaio e seus efeitos. |

Executar na raiz. Docker precisa responder e os serviços apropriados devem estar iniciados. Backup usa o Compose de desenvolvimento; TLS e backup privado dependem do Compose com TLS local. Os parâmetros do banco e S3 precisam apontar para a mesma instalação de teste.

Carga usa `LOAD_TEST_DATABASE_URL` com sufixo `_load_test` e abre porta local 3009; **trunca dados desse banco**. Backup aceita `TEST_DATABASE_URL` com sufixo `_test`, cria recursos com identificadores aleatórios e os preserva para inspeção. Não automatiza sua limpeza.

TLS usa `TLS_PROXY_CONTAINER`, `TLS_APP_CONTAINER` e `HTTPS_PORT` (padrão 8443). Reinicia a aplicação e preserva a conta fictícia criada. A CA é confiada somente naquela requisição; a confiança do sistema não muda. Requisições e comandos de reinício possuem tempo limite.

O ensaio privado exige `BACKUP_DOCKER_NETWORK`, `BACKUP_DOCKER_ENV_FILE` e `BACKUP_DB_CONTAINER`; não executar sobre produção em uso. Não é backup do Neon. Chave e parâmetros S3 devem corresponder à instalação.

Saídas JSON ficam em `docs/evidencias/infraestrutura`. Carga local não mede autoescala; TLS local não comprova o domínio público; backup aprovado não substitui política de retenção ou ensaio da restauração de produção.

[Voltar aos scripts](../README.md) · [Relatório de testes](../../docs/relatorio-testes.md)
