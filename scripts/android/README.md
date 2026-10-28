# Conexão e ensaio Android

| Arquivo | Função |
|---|---|
| [connect-android.ts](connect-android.ts) | Localiza ADB, seleciona Android autorizado, verifica `/api/health`, configura `adb reverse`, instala APK opcional e abre o pacote local. |
| [start-emulator.sh](start-emulator.sh) | Prepara SDK/AVD e inicia emulador API 35 sem janela no runner Linux do GitHub, com KVM e espera limitada pelo boot. |
| [verify-integrated.py](verify-integrated.py) | Opera APK por UIAutomator, cria dados fictícios e confere persistência pela API real. Registra passos, telas e diagnóstico nativo. |

Para conectar um aparelho local, iniciar Docker/API, autorizar depuração USB e executar na raiz:

```powershell
pnpm mobile:connect
pnpm mobile:connect --serial IDENTIFICADOR --install C:/caminho/LinkAtletas-local.apk
```

`API_PORT` escolhe a porta da API no computador; o aplicativo acessa porta 3001 encaminhada pelo ADB. Com mais de um aparelho, `--serial` é obrigatório. O pacote esperado é `br.edu.linkatletas.app.local`, não um aplicativo publicado em loja.

Os outros scripts são usados pelo [workflow Android](../../.github/workflows/android-integrated.yml). O shell depende das ferramentas e variáveis do runner; não é instalador genérico para Windows. O ensaio Python exige um único emulador selecionável por ADB, APK instalado e ambiente local isolado com PostgreSQL, SMTP e S3.

O Python recusa `DATABASE_URL` ausente, remota ou sem sufixo `_test`, e `NODE_ENV=production`. Essa proteção confere o ambiente do processo: o operador também deve garantir que a API local use o mesmo banco. `ANDROID_TEST_FOCUS` aceita `all`, `workout` e `media`; o relatório identifica o foco executado.

O cliente nativo atende ao atleta. Ações auxiliares do treinador são feitas por HTTP; não apresentar como jornada nativa dos três papéis. Usa fixtures locais e `REVIEW_MIN_DAYS=0` no runner, sem alterar a regra de produção.

Resultados ficam em `emulator-evidence/`. O teste pode criar vínculos/treinos, mudar consentimentos, recuperar senha e encerrar conta fictícia. Valida emulador, não aparelho físico, iOS, lojas ou pagamentos externos.

[Voltar aos scripts](../README.md) · [Aplicativo](../../mobile/README.md)
