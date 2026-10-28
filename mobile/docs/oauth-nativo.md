# Google Agenda e Meet no aplicativo

A agenda interna funciona com a API do LinkAtletas. A conexao Google e opcional e serve para criar um evento na agenda do treinador e vincular o Meet a uma consultoria ja agendada. Nao substitui o login do LinkAtletas nem a verificacao manual de CREF.

## Configuracao

O projeto Google Cloud e `linkatletas`, na conta profissional. O aplicativo usa `react-native-nitro-google-signin` com o escopo `https://www.googleapis.com/auth/calendar.events.owned`. A Calendar API precisa estar habilitada. O consentimento permanece em modo de teste; a conta precisa constar na lista de usuarios de teste.

- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`: identifica a audiencia usada pelo SDK. Configurado como variavel publica do GitHub Actions nos dois repositorios.
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`: cliente para `br.edu.linkatletas.app`; o plugin Expo registra o esquema de retorno. Configurado nas mesmas variaveis publicas.
- Android exige cliente separado para cada combinacao de pacote e assinatura: `br.edu.linkatletas.app.local` no APK local e `br.edu.linkatletas.app` no perfil normal. O SHA-1 deve ser o do APK instalado, disponivel no artefato `signing-certificate.txt`.

Os IDs sao publicos. Nenhum segredo de cliente, senha Google ou token de acesso deve entrar no Git, no APK ou em evidencias. O token Google fica apenas na memoria e e descartado ao desconectar ou sair da conta. O SDK pode manter o consentimento da conta no sistema; revogacao definitiva e feita nos aplicativos conectados da conta Google.

O modulo exige APK/development build proprio; Expo Go nao o inclui. Mudancas nas variaveis publicas exigem nova compilacao.

## Uso

1. Entrar como treinador e abrir Agenda.
2. Conectar Google Agenda e autorizar a conta de teste no fluxo nativo.
3. Em uma consultoria futura agendada, confirmar Criar evento Google e Meet.
4. Conferir evento na agenda Google e referencia persistida no LinkAtletas.

O Google recebe titulo generico, horario e duracao. Nao recebe nomes dos participantes, descricao privada, dados de saude ou convidados automaticos. A operacao utiliza ID deterministico para recuperar o mesmo evento se houver falha de rede ou de vinculacao. A criacao de Meet depende da disponibilidade dessa funcionalidade na conta Google.

Reagendar/cancelar a consultoria interna ainda exige atualizar tambem o evento externo; nao ha sincronizacao bidirecional. Desconectar nao apaga eventos ja criados.

## Validacao e limites

[google-calendar.test.ts](../tests/google-calendar.test.ts) verifica autorizacao, cancelamento, escopo faltante, ausencia de configuracao, limpeza de token, envio minimo de dados, reuso de evento, conflito de criacao, expiracao, conferencia indisponivel e URLs indevidas. Usa SDK e HTTP controlados; nao e prova de consentimento real.

O workflow [android-integrated.yml](../../.github/workflows/android-integrated.yml) compila um APK real e testa a aplicacao com API/PostgreSQL isolados. O ensaio de tres perfis esta em [verify-roles.py](../scripts/verify-roles.py). Nao autentica uma conta pessoal Google no runner nem prova funcionamento em aparelho fisico ou iOS.

A homologacao real do OAuth exige uma conta de teste autorizada em um dispositivo, evento criado no Calendar e vinculo confirmado na API. Enquanto essa verificacao nao estiver registrada, a integracao permanece em validacao.

## APK HTTPS para demonstracao

O workflow aceita `build_profile=cloud` somente com `build_only=true` e sem reaproveitar APK de outro perfil. Exemplo na raiz:

```powershell
gh workflow run android-integrated.yml --repo DaviSouza78/LinkAtletas --ref main -f build_profile=cloud -f build_only=true
```

O artefato `LinkAtletas-APK-cloud` contem `LinkAtletas.apk`, SHA-256 e fingerprint da assinatura. Usa a API HTTPS publicada e nao depende de Docker/Metro local. Continua sendo APK de demonstracao com chave de desenvolvimento; nao e assinatura para lojas. O ensaio integrado usa somente o perfil local, nunca executa criacao de fixtures automaticamente em producao.
