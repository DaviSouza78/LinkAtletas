# Verificação do cliente React Native/Expo

Consolidação revisada em 21/10/2026; cada build conserva fonte e hash próprios. Ambiente local: Windows, Node 24.15.0, pnpm 10.33.2. Build e emulador executados no runner Linux do GitHub. Fonte: [mobile](../../../mobile/README.md), dependências fixadas em manifesto e lockfile independentes.

| Verificação | Resultado | Evidência |
|---|---|---|
| TypeScript das telas, transporte e contratos compartilhados | Passou, sem erros | [mobile-typecheck.log](mobile-typecheck.log) |
| Dependências compatíveis com o SDK fixado | Nove pacotes de runtime conferidos contra a matriz do Expo 57.0.30 instalado | [Resultado](mobile-compatibility-locked.json), [log](mobile-dependencies.log) |
| Expo Doctor 1.20.4 | 21 de 21 verificações passaram na execução de 20/10 | [mobile-doctor.log](mobile-doctor.log); recomendações online posteriores são separadas da compatibilidade fixada |
| Testes do transporte com módulos nativos controlados | 22 testes de transporte/configuração passaram | [mobile-tests.json](mobile-tests.json), [fonte dos testes](../../../mobile/tests/api.test.ts) |
| Exportação Hermes Android | Passou, 631 módulos | [mobile-export.log](mobile-export.log) |
| Exportação Hermes iOS | Passou, 633 módulos | [mobile-export.log](mobile-export.log) |
| Tamanho e SHA-256 dos bundles e metadados | Registrados após exportação | [mobile-bundles.json](mobile-bundles.json) |
| Compilar APK Android local corrigido | Passou no runner GitHub com Java/Android SDK; chave de desenvolvimento | [Build remoto](github-android-local-build.json), [hash e limites](../publicacao.md) |
| Instalar e abrir o APK no emulador | Passou, Android API 35 x86_64, tela de login visível e sem crash detectado | [Resultado](android-emulator-result.json), [captura](android-emulator-startup.png), [run aprovado](https://github.com/DaviSouza78/LinkAtletas/actions/runs/38675093814) |
| Jornada integrada do APK local corrigido | 18/18 etapas aprovadas contra API/PostgreSQL/SMTP/S3 reais no emulador | [Resultado completo](android-integrated-result.json), [GitHub](github-android-integrated.json), [upload](android-integrated-midia-feedback.png) |
| Fluxo completo em aparelho Android físico | Pendente: não havia dispositivo físico autorizado conectado | O APK local permite conexão USB sem domínio público; emulador e hardware são evidências distintas |
| Compilar IPA e usar em iPhone/iPad | Pendente: exige Mac/Xcode ou serviço autorizado | Não há evidência de execução em dispositivo |
| Alternativa Expo Go/development build | Não utilizada no ensaio; o APK standalone dispensa esse cliente | É uma alternativa de desenvolvimento, não uma exigência para executar o APK entregue |
| Publicação nas lojas | Não realizada | Não foram criadas contas nem enviados aplicativos |

Versões verificadas: Expo 57.0.30, React Native 0.86.3, React 19.2.3, TypeScript 6.0.3. O SDK foi selecionado conforme [matriz oficial](https://docs.expo.dev/versions/latest/); os módulos nativos foram alinhados por `expo install` e o resultado foi conferido pelo Doctor.

Os testes verificam armazenamento no SecureStore por adaptador controlado, cabeçalho Bearer sem token em URL, bloqueio de perfil não atleta, invalidação da sessão expirada, preservação da sessão quando apenas a senha de confirmação está errada, limpeza no logout sem rede, cabeçalho do WebSocket nativo, limpeza de cópia temporária após compartilhamento e bloqueio de HTTP em produção. Esses testes unitários não executam o Keychain/Keystore real; a restauração real da sessão no emulador é conferida pelo ensaio do APK, separado abaixo.

O diretório ignorado `mobile/dist` contém os bundles Hermes exportados; uma cópia compactada local está em `C:/dev/output/LinkAtletas-Mobile-Hermes.zip`. Esses arquivos são bundles JavaScript/Hermes e não equivalem a APK/IPA instalável. Sem configuração HTTPS de `EXPO_PUBLIC_API_URL`, a versão de produção mostra a pendência e bloqueia o envio de credenciais. `pnpm start` usa o modo de desenvolvimento para a API local.

## Perfil local e política de rede

APK standalone **LinkAtletas Local**, pacote `br.edu.linkatletas.app.local`, compilado no [run 39518119323](https://github.com/DaviSouza78/LinkAtletas/actions/runs/39518119323) a partir de `e3393fa3b85afae32842894fc9ba1c67b7470b2e`, SHA-256 `5e8365264c329bbb5539b0ab3b5affb664440705c3fe12ec9eb833dbf39fdc0b`. Assinatura de desenvolvimento; sem Metro/conta Expo. O APK documental anterior continua histórico.

O [manifesto Android verificado](android-network-policy.json) bloqueia HTTP no perfil normal e limita a exceção de demonstração a localhost/127.0.0.1/10.0.2.2. O [manual USB](../manual-apk-local.md) explica o túnel ADB; não é necessário publicar banco ou API para essa demonstração. Dois alertas do tooling sem correção oficial permanecem na [auditoria](../seguranca-dependencias.md).

O APK corrigido aprovou o [teste isolado de mídia](android-media-focus.json), [run 39519095763](https://github.com/DaviSouza78/LinkAtletas/actions/runs/39519095763): login, seletor de arquivos do sistema, upload S3 real e correção do treinador visível no aplicativo. Esse foco cobre duas etapas e é separado da jornada completa.

## Jornada integrada e histórico dos diagnósticos

O binário corrigido aprovou as 18 etapas em 21/10/2026: [resultado completo](android-integrated-result.json), [run 39522996463, tentativa 2](https://github.com/DaviSouza78/LinkAtletas/actions/runs/39522996463/attempts/2). Cadastro, sessão segura restaurada, perfil, contratação, treino, chat, agenda, avaliação, mídia/correção, notificações, recuperação SMTP, revogação e encerramento foram exercitados pelo APK e conferidos no servidor. O modo acadêmico não realizou cobrança; carência zero de review foi usada somente na fixture isolada.

Na versão anterior do APK local, o [diagnóstico isolado de treino](android-workout-focus.json), [run 39508080241](https://github.com/DaviSouza78/LinkAtletas/actions/runs/39508080241), aprovou login e gravação da execução contra API/PostgreSQL reais. Esse resultado cobre duas etapas e não valida o binário corrigido. Na tentativa completa [39508143676](https://github.com/DaviSouza78/LinkAtletas/actions/runs/39508143676), 12 etapas passaram e o seletor acionou a prévia do Google Photos. A seleção foi corrigida, permitindo reproduzir o erro real de upload do cliente: [falha histórica](android-upload-legado.json), [captura](android-upload-legado.png). O APK atual foi recompilado com `File` compatível com o fetch do Expo e possui hash distinto.

## Roteiro para a homologação em dispositivo

1. Executar serviços e API e instalar o APK local com o túnel USB conforme o manual. Expo Go/development build é uma alternativa de desenvolvimento.
2. Cadastrar atleta, fechar/reabrir para conferir restauração segura da sessão e entrar com perfil inválido para confirmar recusa.
3. Completar perfil, buscar treinador compatível e solicitar vínculo; aceitar na interface web do treinador.
4. Prescrever treino pela web, registrar blocos/esforço/métricas no aparelho e conferir na conta do treinador.
5. Conceder consentimento de performance, escolher um arquivo no aparelho, enviá-lo, receber correção e abrir o arquivo privado. Conferir a revogação do consentimento.
6. Manter web e aplicativo simultâneos para testar chat nos dois sentidos, leitura, reconexão e histórico após reiniciar a API.
7. Agendar/reagendar/cancelar consultoria, conferir conflito, abrir reunião externa já vinculada e observar notificações.
8. Testar avaliação em vínculo elegível e denúncia/moderação pela administração. Não alterar datas reais para simular elegibilidade em produção.
9. Em conta sandbox configurada, abrir checkout hospedado, aguardar webhook real e conferir cancelamento/vigência. O modo acadêmico deve continuar informando ausência de cobrança.
10. Testar recuperação, exportação pela folha do sistema e exclusão com senha; conferir revogação de outras sessões e retenção financeira quando aplicável.
11. Conferir TalkBack/VoiceOver, texto ampliado, teclado, rede intermitente, arquivos grandes e diferentes tamanhos de tela; registrar aparelho, versão do sistema e evidências antes de marcar a homologação.
