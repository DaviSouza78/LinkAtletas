# Verificação manual do site — 27/10/2026

Ambientes: aplicação pública HTTPS na Vercel e ambiente local com PostgreSQL, SMTP e armazenamento de desenvolvimento. A navegação manual foi realizada no navegador ao lado do chat. Foram usadas contas e informações fictícias identificadas como teste; nenhum pagamento real foi realizado.

## Cenários conferidos pela interface pública

| Área | Ação e resultado observado |
|---|---|
| Autenticação | Campos obrigatórios bloquearam formulário vazio; senha incorreta exibiu erro; atleta e treinador entraram e saíram normalmente. |
| Perfil | Atleta e treinador salvaram cidade, descrição, modalidade, objetivo, nível, disponibilidade e valor. A busca exibiu os dados persistidos e compatibilidade de 100% para a fixture. |
| Permissões | Atleta que abriu `/admin` foi redirecionado ao próprio painel. |
| CREF | Treinador enviou evidência fictícia e recebeu status de análise pendente. A preparação da aprovação em produção foi feita pela API administrativa, não pela interface. |
| Descoberta e vínculo | Atleta filtrou o treinador fictício, solicitou acompanhamento e viu o estado pendente; treinador aceitou e o vínculo ficou ativo. |
| Treinos | Treinador salvou rascunho, reabriu os dados e publicou. Atleta recebeu a ficha e registrou bloco realizado, esforço, observação, distância e duração. O treinador conferiu a execução persistida. |
| Arquivos | Atleta selecionou imagem fictícia pelo navegador e enviou ao armazenamento privado. Treinador acessou o registro e enviou correção técnica, confirmada pela interface. |
| Mensagens | Treinador enviou mensagem; atleta recebeu e respondeu. A confirmação inicial é de envio persistido, não garantia de entrega instantânea por WebSocket. |
| Agenda | Treinador agendou consultoria futura, recebeu bloqueio ao tentar horário conflitante e reagendou. Atleta viu o novo horário e cancelou com justificativa. Conclusão antecipada estava desabilitada. |
| Financeiro | Modo acadêmico indicou ausência de cobrança real; treinador salvou plano fictício. Credencial/carteira real e checkout financeiro externo não foram ativados. |
| Avaliações | Conta sem vínculo não podia publicar. Após criar o vínculo, tentativa de avaliar antes de sete dias foi recusada com mensagem de carência. |
| Notificações | Avisos de mensagem e agenda apareceram; marcar todas como lidas reduziu o contador a zero. |
| Privacidade | Atleta concedeu finalidade de performance e recebeu confirmação de gravação. |
| Recuperação | E-mail inexistente recebeu resposta genérica, sem revelar existência de conta. Isso não comprova chegada de e-mail ou redefinição pela interface nesta sessão. |

## Administração no ambiente local

- Login com administrador demonstrativo funcionou.
- Aprovação sem justificativa foi bloqueada; aprovação justificada da fixture foi salva.
- Suspensão da fixture foi registrada. O reteste após a correção mostrou status atual Suspenso e aprovação histórica separada.
- Limite inválido de comissão foi bloqueado. Gravação dos valores anteriores foi confirmada, sem alterar regras de produção.
- Telas de moderação, pedidos de privacidade e regras financeiras foram abertas. A moderação estava sem avaliações; não se afirma que ocultar/restaurar uma avaliação tenha sido testado manualmente nesta sessão.
- A confirmação de revogação travou no controle da aba local. A revogação fica coberta separadamente pelos testes de API e de navegador automatizado; a tentativa manual interrompida não conta como aprovação.

## Bugs corrigidos

1. **Status administrativo desatualizado:** após suspensão, o cartão continuava mostrando a aprovação da submissão antiga. A API agora devolve a situação atual do perfil separada do histórico; a interface distingue ambas e impede nova suspensão enquanto suspenso, mantendo a revogação disponível.
2. **Texto financeiro do atleta:** o total de pagamentos era rotulado como recebimentos. O rótulo agora respeita o papel da conta.
3. **Indicação do chat:** sem conexão WebSocket, a interface permanecia em Reconectando, embora a atualização periódica já funcionasse. Agora informa atualização a cada dez segundos. A rotina de atualização existente foi preservada.

## Limites

Não houve cobrança Asaas, Google OAuth real, envio a terceiros reais, publicação em lojas, teste em aparelho físico ou auditoria completa de acessibilidade. Novas contas foram preparadas pela API; a criação via formulário é exercitada pela suíte automatizada. O login administrativo inicial de produção foi confirmado pela API sem divulgar credenciais. Os testes manuais não garantem ausência de outros erros.

## Verificações complementares executadas

- Build web e tipos de aplicação, servidor e testes aprovados após as correções.
- Suíte completa de unidade/API: 99/99 aprovados. O teste de plataforma foi ampliado para verificar situação atual suspensa/revogada sem sobrescrever a decisão histórica; seus 13 cenários passaram novamente.
- [Regressão final Chromium](evidencias/manual-2026-10-27/playwright-results.json): 5/5 aprovados, incluindo cadastro pela interface, jornada completa, teclado, responsividade e axe. A jornada agora também suspende e revoga a fixture pelo painel e verifica os dois estados. [Captura do status atual e decisão histórica](evidencias/manual-2026-10-27/admin-status-atual.png).
- Uma execução intermediária do navegador falhou ao carregar a sessão, com erro de conexão visível; não foi considerada aprovada. A execução final estável repetiu os cinco cenários, sem retries, e passou.
- [Verificações HTTP adicionais e limpeza](evidencias/manual-2026-10-27/http-checks.json): download privado com bytes idênticos; acesso anônimo recusado; exportação dos dados das duas contas; encerramento bloqueado com senha incorreta; encerramento/anônimização com senha correta; login posterior recusado. Esses são testes de API, não ações manuais pela interface.
- As duas contas sintéticas de produção foram encerradas/anônimizadas pela API, os arquivos da fixture removidos pelo fluxo de encerramento e a sessão administrativa temporária finalizada. Não foram removidas contas reais ou a conta administrativa do titular.
