# Verificação do cliente React Native/Expo

Consolidação local: 14/10/2026; compilação e inicialização remotas atualizadas em 15/10/2026. Ambiente local: Windows, Node 24.15.0, pnpm 10.33.2. Build e emulador executados no runner Linux do GitHub. Fonte: [mobile](../../../mobile/README.md), dependências fixadas em manifesto e lockfile independentes.

| Verificação | Resultado | Evidência |
|---|---|---|
| TypeScript das telas, transporte e contratos compartilhados | Passou, sem erros | [mobile-typecheck.log](mobile-typecheck.log) |
| Dependências compatíveis com Expo SDK 57 | Passou | [mobile-dependencies.log](mobile-dependencies.log) |
| Expo Doctor 1.20.4 | 21 de 21 verificações passaram | [mobile-doctor.log](mobile-doctor.log) |
| Testes do transporte com módulos nativos controlados | 9 testes passaram | [mobile-tests.json](mobile-tests.json), [fonte dos testes](../../../mobile/tests/api.test.ts) |
| Exportação Hermes Android | Passou, 612 módulos | [mobile-export.log](mobile-export.log) |
| Exportação Hermes iOS | Passou, 614 módulos | [mobile-export.log](mobile-export.log) |
| Tamanho e SHA-256 dos bundles e metadados | Registrados após exportação | [mobile-bundles.json](mobile-bundles.json) |
| Compilar APK Android | Passou no runner GitHub com Java/Android SDK; chave de desenvolvimento | [Build remoto](github-android-build.json), [hash e limites](../publicacao.md) |
| Instalar e abrir o APK no emulador | Passou, Android API 35 x86_64, tela de login visível e sem crash detectado | [Resultado](android-emulator-result.json), [captura](android-emulator-startup.png), [run aprovado](https://github.com/DaviSouza78/LinkAtletas/actions/runs/38675093814) |
| Fluxo completo em aparelho Android | Pendente: requer API HTTPS alcançável e aparelho | Não substituído pelo build nem pela inicialização no emulador |
| Compilar IPA e usar em iPhone/iPad | Pendente: exige Mac/Xcode ou serviço autorizado | Não há evidência de execução em dispositivo |
| Execução manual dos fluxos em Expo Go/development build | Pendente de dispositivo/emulador compatível e API alcançável | Não foi substituída por teste de navegador |
| Publicação nas lojas | Não realizada | Não foram criadas contas nem enviados aplicativos |

Versões verificadas: Expo 57.0.29, React Native 0.86.3, React 19.2.3, TypeScript 6.0.3. O SDK foi selecionado conforme [matriz oficial](https://docs.expo.dev/versions/latest/); os módulos nativos foram alinhados por `expo install` e o resultado foi conferido pelo Doctor.

Os testes verificam armazenamento no SecureStore por adaptador controlado, cabeçalho Bearer sem token em URL, bloqueio de perfil não atleta, invalidação da sessão expirada, preservação da sessão quando apenas a senha de confirmação está errada, limpeza no logout sem rede, cabeçalho do WebSocket nativo, limpeza de cópia temporária após compartilhamento e bloqueio de HTTP em produção. Não executam o Keychain/Keystore real do aparelho.

O diretório ignorado `mobile/dist` contém os bundles Hermes exportados; uma cópia compactada local está em `C:/dev/output/LinkAtletas-Mobile-Hermes.zip`. Esses arquivos são bundles JavaScript/Hermes e não equivalem a APK/IPA instalável. Sem configuração HTTPS de `EXPO_PUBLIC_API_URL`, a versão de produção mostra a pendência e bloqueia o envio de credenciais. `pnpm start` usa o modo de desenvolvimento para a API local.

## Roteiro para a homologação em dispositivo

1. Executar serviços e API, configurar URL alcançável e abrir o aplicativo com Expo compatível ou development build.
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
