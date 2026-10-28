# Configuração nativa

[withLocalNetwork.cjs](withLocalNetwork.cjs) é um config plugin do Expo registrado em [app.config.ts](../app.config.ts). É aplicado durante o prebuild Android.

- Perfil `EXPO_PUBLIC_BUILD_PROFILE=local`: gera a exceção HTTP somente para `localhost`, `127.0.0.1` e `10.0.2.2`.
- Perfil normal: remove a referência/XML da exceção local e mantém tráfego HTTP geral desabilitado.

O plugin não configura banco nem credenciais e não abre portas do computador. A [política do cliente](../src/config/api.ts) também valida o endereço antes das chamadas.

Mudanças nativas exigem novo prebuild/compilação do APK; não são aplicadas a um aplicativo já instalado somente por alterar JavaScript. O plugin trata Android; não comprova configuração ou execução de iOS.

[Aplicativo](../README.md) · [Conexão e ensaio Android](../../scripts/android/README.md)
