# Banco: backup e metadados

| Arquivo | Função |
|---|---|
| [backup.ts](backup.ts) | Executa `pg_dump` no contêiner, cifra o dump com AES-256-GCM, copia objetos S3 já cifrados e grava manifesto com hashes e contagens. |
| [restore.ts](restore.ts) | Confere chave, integridade e destinos vazios; restaura banco e objetos e compara os resultados. |
| [backup-shared.ts](backup-shared.ts) | Helpers de chave, caminhos, comandos Docker, contagens e S3 direto ou por worker na rede privada. Não é comando independente. |
| [export-schema.ts](export-schema.ts) | Consulta metadados PostgreSQL e atualiza JSON do esquema, dicionário e fonte Mermaid do DER. Não exporta registros dos usuários. |

Executar na raiz:

```powershell
pnpm exec tsx scripts/banco/backup.ts nome-do-backup
pnpm exec tsx scripts/banco/restore.ts nome-do-backup destino_test bucket-vazio-de-teste
pnpm exec tsx scripts/banco/export-schema.ts
```

Backup/restauração usam Docker e os parâmetros `BACKUP_DB_CONTAINER`, `BACKUP_DB_USER`, `BACKUP_DB_NAME`, `BACKUP_ROOT` e S3. O padrão é local; `DATABASE_URL` não altera o banco usado por `pg_dump`. Somente `export-schema.ts` usa a conexão da aplicação, portanto conferir seu destino antes de gerar documentação.

`BACKUP_ROOT` tem padrão `tmp/backups`; o diretório do backup deve ficar estritamente dentro dele. A chave vem de `DATA_ENCRYPTION_KEY` ou do arquivo local existente. O manifesto não inclui essa chave, mas contém nomes de objetos e contagens, portanto também deve permanecer privado.

A restauração exige banco existente e vazio com sufixo `_test` e bucket vazio. Não apaga destino ocupado, mas uma falha posterior pode deixar restauração parcial; não há transação distribuída entre banco e S3. Suspender escritas durante o backup e reaplicar eliminações posteriores quando necessário.

O worker privado exige rede, imagem e arquivo de ambiente configurados por `BACKUP_DOCKER_*`; não publica a porta do armazenamento. Esses utilitários não implementam agendamento recorrente nem substituem o procedimento de backup do Neon.

[Voltar aos scripts](../README.md) · [Procedimento operacional](../../docs/evolucao/operacao/manual.md)
