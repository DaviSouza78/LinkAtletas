# LinkAtletas — aplicativo do atleta

Cliente React Native/Expo da mesma API Node/PostgreSQL. Perfis de treinador e administrador usam a interface web. Não há servidor nem dados fictícios próprios no aplicativo.

## Instalação e execução

Pré-requisitos: Node 24, pnpm 10.33.2 e serviços da raiz em execução (`docker compose up -d --wait`, migrações, seed e API). Execute a partir deste diretório:

```powershell
pnpm install --frozen-lockfile
Copy-Item .env.example .env
pnpm start
```

Configure `EXPO_PUBLIC_API_URL` com a URL completa terminada em `/api`. Android em emulador pode alcançar o host em `http://10.0.2.2:3001/api`; iOS no simulador do Mac pode usar `http://localhost:3001/api`. Dispositivo físico precisa de endereço de rede alcançável e API ligada à interface apropriada, com firewall configurado pelo responsável. A API local normalmente escuta somente `127.0.0.1`; para acesso de emulador/dispositivo, inicie-a com `API_HOST=0.0.0.0` em rede de desenvolvimento controlada. Não exponha a base de demonstração à internet.

Abra com um cliente Expo compatível com SDK 57 ou development build. A compilação nativa local usa `pnpm android` (JDK/Android SDK) ou `pnpm ios` (Mac/Xcode). Estes comandos não foram executados neste ambiente sem SDK/JDK/Xcode. Compilação/distribuição EAS depende de conta, credenciais e autorização; nenhum aplicativo foi enviado às lojas.

## Verificações reproduzíveis

```powershell
pnpm typecheck
pnpm check
pnpm test
$env:EXPO_PUBLIC_API_URL = 'https://api.seu-dominio.example/api'
pnpm export
```

Use sua URL real de HTTPS antes de distribuir. O domínio `.example` acima é apenas documentação. Builds de produção recusam chamadas HTTP e mostram o erro de configuração; builds de desenvolvimento podem usar a rede local. O Metro precisa do arquivo `metro.config.cjs` para resolver o catálogo compartilhado em `../shared`.

O export gera bundles Hermes Android/iOS em `dist/`, ignorado pelo Git. Geração de bundles e testes do transporte com módulos nativos controlados não comprovam execução em dispositivo, APK/IPA, leitura de tela ou homologação nas lojas. Veja [evidências](../docs/evolucao/evidencias/mobile-verificacao.md).

Há também um APK Android compilado pelo workflow manual `Android APK verification`: [execução e hash](../docs/evolucao/publicacao.md). Ele usa a chave de desenvolvimento do template Expo. Configure a variável de repositório `EXPO_PUBLIC_API_URL` com uma API HTTPS alcançável e gere outro APK para testar integrações; o binário de verificação existente usa um endereço `.example` documental. Distribuição nas lojas e homologação completa em aparelhos permanecem pendentes.

## Funcionalidades

- Cadastro e login do atleta, restauração de sessão, logout, recuperação e redefinição de senha.
- Perfil, preferências de matchmaking, descoberta e solicitação/encerramento de vínculos.
- Treinos publicados, blocos realizados, esforço, métricas por modalidade e notas ao treinador.
- Envio de performance mediante consentimento, arquivos privados, download/compartilhamento explícito e correções recebidas.
- Chat com WebSocket autenticado por cabeçalho, reconexão, histórico paginado e confirmação de leitura.
- Agenda com agendamento, reagendamento, cancelamento e histórico; abertura de reunião externa já vinculada.
- Avaliações elegíveis, edição, leitura de resposta e pedido de moderação.
- Notificações persistidas, financeiro e acesso ao checkout hospedado somente quando configurado.
- Consentimentos versionados, dados privados de saúde, exportação e solicitação de exclusão com senha.

Recuperação: o e-mail enviado contém o link web seguro de redefinição. O usuário pode abri-lo no navegador ou copiar o token após `token=` para a tela “Redefinir senha” do aplicativo. O esquema `linkatletas` está reservado para integração futura; não há universal links homologados. A criação OAuth de evento Google acontece na interface web quando configurada; o aplicativo abre a referência persistida, sem criar convites em segundo plano.

## Sessão e arquivos privados

Somente o token opaco é armazenado no SecureStore; senha e chaves de serviços não são persistidas. HTTP utiliza `Authorization: Bearer`, e WebSocket usa cabeçalho nativo. Tokens nunca são enviados em query string. Sessões invalidadas pelo servidor retornam à entrada. Senha incorreta na confirmação de exclusão permite nova tentativa sem encerrar uma sessão válida.

Compartilhar um arquivo ou exportação cria uma cópia transitória no cache privado, abre a folha de compartilhamento do sistema e remove a cópia após a ação. Destinos selecionados pelo usuário podem manter suas próprias cópias. Segredos Asaas, S3, SMTP e de criptografia pertencem exclusivamente ao servidor; não use prefixo `EXPO_PUBLIC_` para eles.

Referências de versão e segurança: [Expo SDK](https://docs.expo.dev/versions/latest/), [SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/), [compilação local](https://docs.expo.dev/guides/local-app-overview/).
