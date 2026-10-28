# Scripts de manutenção

Executar os comandos a partir da raiz do repositório. Os atalhos do [package.json](../package.json) continuam sendo a forma preferencial de uso.

| Pasta | Finalidade | Comandos principais |
|---|---|---|
| [banco](banco) | Backup, restauração e exportação de metadados | Scripts desta pasta; conferir o ambiente antes de executar backup ou restauração. |
| [documentacao](documentacao) | Conferência, exportação de API, documentos e diagramas | `pnpm docs:check`, `pnpm api:export`, `pnpm docs:build` |
| [operacao](operacao) | Inicialização da implantação em contêineres | `pnpm production:init`; o Docker usa o script de entrada desta pasta. |
| [verificacao](verificacao) | Smoke, carga, backup e TLS | `pnpm test:smoke`, `pnpm test:load`, `pnpm test:backup`, `pnpm test:tls` |
| [android](android) | Conexão ao Android, emulador e verificações do APK | `pnpm mobile:connect` e workflows Android. |

Os geradores da ERS registram processos anteriores e podem sobrescrever arquivos de saída. Consultar as [instruções do template](../docs/evolucao/template/README.md) antes de usá-los; eles não são necessários para executar o site.

Arquivos `.env`, chaves locais e configuração `.vercel` continuam nos locais esperados pelas ferramentas e ficam fora do Git. Mover um script não concede autorização para alterar bancos ou serviços externos.
