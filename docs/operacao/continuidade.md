# Continuidade e manutenção

Limitações, validações externas e próximos trabalhos do projeto. Este documento complementa o backlog e não registra novos resultados de testes.

## Operação

- Consultar o [registro da implantação](../evidencias/relatorios/implantacao-2026-10-26.md) para serviços configurados, verificações realizadas e limites da demonstração.
- Manter credenciais nos provedores e no ambiente privado. Contas administrativas e redefinição de senha ficam sob responsabilidade de seus titulares.
- Acompanhar as dependências com auditorias dos lockfiles da raiz e do aplicativo; resultados antigos não substituem uma nova análise.
- Revisar procedimentos de privacidade e retenção antes de receber dados reais.

## Evoluções e validações externas

- **CREF:** a conferência atual é manual pelo administrador, conforme a ERS. Automatizar exige uma fonte autorizada e uma nova decisão da equipe.
- **Financeiro:** os cenários automatizados usam um provedor controlado. Cobranças e split reais dependem de credenciais e homologação externa; não são comprovados por esses testes.
- **Aplicativo e Google:** consultar o [índice da documentação móvel](../../mobile/README.md) para implementação, testes e limites de OAuth e dispositivos. A validação real pendente deve ser registrada por quem a executar.
- **Distribuição:** homologação em aparelhos físicos e publicação em lojas exigem dispositivos, contas e assinatura adequados. Compilar um APK não comprova esses passos.

Prioridades e itens futuros estão no [backlog](../requisitos/backlog.md); dependências e alternativas estão no [guia de serviços externos](servicos-externos.md).
