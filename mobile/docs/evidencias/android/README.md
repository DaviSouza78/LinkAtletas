# Validacao Android dos tres perfis

Ensaio concluido em 28/10/2026, com 17 etapas aprovadas no APK instalado em emulador Android API 35. A aplicacao usou API Fastify e PostgreSQL reais, isolados no runner; cada passo que altera dados foi conferido pela API. Contas e registros sao ficticios.

- [Execucao completa no GitHub Actions](https://github.com/DaviSouza78/LinkAtletas/actions/runs/40646752787).
- [Resultado detalhado: nome e resultado de cada etapa](perfis-integrados.json).
- [Roteiro executavel](../../../scripts/verify-roles.py).
- Commit do APK e roteiro: `445c607607a57ea40301dd1c5c0d7a1f0d4e2a86`.
- SHA-256 do APK local: `58c934f12fd4f9a22b907a335fb8ec74ba1f00e94a6f9f2b3645bb5a56468a71`.
- Duracao do percurso: 855,8 segundos, apos a compilacao/instalacao.

## O que foi aprovado

| Perfil/area | Operacoes verificadas |
|---|---|
| Sessao | Erro de login exibido sem crash, cadastro de treinador, restauracao da sessao e troca entre os tres perfis. |
| Treinador | Edicao de preco persistida, envio de CREF, aceite de solicitacao, publicacao de treino com bloco, configuracao de plano academico, resposta a avaliacao e mensagem ao atleta. |
| Atleta | Cadastro, descoberta de treinador aprovado, solicitacao de vinculo, execucao do treino com retorno persistido, mensagem e publicacao de avaliacao. |
| Administrador | Aprovacao manual de CREF, efeito no perfil, alteracao de comissao/carencia, abertura dos pedidos de privacidade e avisos, ocultacao de avaliacao com justificativa. |
| Permissoes na API real | Atleta recusado na fila administrativa de CREF; treinador recusado nos pedidos administrativos de privacidade; atleta recusado na prescricao; administrador sem participacao recusado na conversa privada do vinculo. |
| Estabilidade | Ausencia de FATAL EXCEPTION, TypeError, ReferenceError e Unhandled JS Exception nos logs coletados do percurso. |

Os 17 itens sao etapas descritas individualmente no JSON. Algumas etapas agrupam mais de uma acao relacionada; o numero nao representa 17 endpoints nem todas as combinacoes de permissao existentes.

## Capturas reais do ensaio

- [Administrador: CREF aprovado](administrador-cref-aprovado.png).
- [Treinador: treino publicado](treinador-treino-publicado.png).

As capturas correspondem ao APK desse ensaio. A revisao visual identificou dois botoes iguais de atualizacao na lista do treinador; o codigo posterior reuniu a recarga de treinos e vinculos em uma unica acao. As imagens historicas foram preservadas como evidencias da execucao original.

## APK conectado a nuvem

[Compilacao HTTPS aprovada](https://github.com/DaviSouza78/LinkAtletas/actions/runs/40648525857), commit `af874d15ce4912aae4a45ccd2d1224d5453859c5`.

SHA-256: `65498d8e2ca5a4cbe9f81ed2315612517ac7045798aba5622c60b312de29d79f`. Usa `https://link-atletas.vercel.app/api` e assinatura de desenvolvimento. A compilacao desse perfil nao executa criacao automatica de fixtures em producao. Aprovacao da compilacao e diferente de aprovacao de percurso integrado.

## Limites

O ensaio dos perfis usa carencia de avaliacao zerada somente na fixture isolada e cobranca academica, sem movimentacao financeira. A abertura de pedidos administrativos de privacidade nao comprova todas as decisoes e combinacoes desse modulo.

OAuth Google com consentimento real, criacao real de Meet, aparelho fisico, binario iOS, acessibilidade e pagamentos externos nao foram homologados por esse ensaio. Consulte [OAuth nativo](../../oauth-nativo.md) para o estado dessa integracao. Os 106 testes controlados do cliente sao uma verificacao separada do percurso nativo e nao substituem esses limites.

## Jornada ampliada do atleta

[Segundo ensaio aprovado](https://github.com/DaviSouza78/LinkAtletas/actions/runs/40649006179), com 18 etapas individualizadas em [jornada-integrada.json](jornada-integrada.json). Reaproveita o APK local de SHA-256 registrado acima; o commit do roteiro e `af874d15ce4912aae4a45ccd2d1224d5453859c5`.

Comprova cadastro, sessao restaurada, consentimentos e dados privados, perfil, descoberta/vinculo, execucao de treino, chat nos dois sentidos, agenda interna, avaliacao, identificacao do financeiro academico, seletor nativo e upload real no S3 local, retorno do treinador, notificacoes, recuperacao com SMTP local e nova senha, eliminacao do arquivo ao revogar consentimento e encerramento com revogacao da sessao. As acoes auxiliares do treinador e as conferencias de persistencia desse roteiro usam HTTP direto; as acoes descritas como nativas sao executadas pelo APK.

SMTP e S3 nesse ensaio sao os servicos reais de teste em Docker no runner, sem enviar mensagens ou arquivos a destinatarios externos. O resultado nao homologa Brevo/Tigris nem OAuth Google.
