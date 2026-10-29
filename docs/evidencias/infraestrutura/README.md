# Evidências de infraestrutura

Resultados de verificações técnicas realizadas nos ambientes identificados em cada arquivo:

- `backup-*` e `private-network-backup.json`: ensaios de backup, restauração e isolamento. O [registro da nuvem](../../operacao/implantacao-2026-10-26.md) distingue cópia do banco e cópia dos objetos.
- [production-tls.json](production-tls.json): verificação do ambiente Docker com HTTPS local.
- [carga-matchmaking.json](carga-matchmaking.json): medição de carga do match no ambiente ensaiado.
- `audit-*` e `auditoria-dependencias.json`: resultados datados de dependências. A interpretação está na [auditoria documentada](../../operacao/seguranca-dependencias.md).
- [ambiente-local-revisado.json](ambiente-local-revisado.json): estado dos componentes locais na revisão registrada.

TLS local não comprova o certificado do domínio público; carga local não comprova autoescala; uma restauração aprovada não substitui uma rotina de backup. Os [scripts de verificação](../../../scripts/verificacao/README.md) explicam como cada ensaio funciona.

[Índice das evidências](../README.md)
