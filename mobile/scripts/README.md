# Scripts do aplicativo

[check-dependencies.cjs](check-dependencies.cjs) compara as dependências instaladas com as versões exatas do `package.json` e a matriz nativa do Expo instalado pelo lockfile.

Executar `pnpm check` dentro de `mobile`, ou `pnpm --dir mobile check` na raiz. Requer dependências já instaladas e produz JSON de diagnóstico. Não altera versões nem consulta serviços externos.

`pnpm check:updates` é diferente: consulta as recomendações online do Expo. Uma atualização exige avaliar compatibilidade, recompilar e testar; não atualizar automaticamente um SDK somente para deixar essa consulta sem avisos.

[Aplicativo](../README.md)

## Ensaio integrado do APK

[verify-roles.py](verify-roles.py) controla o APK instalado via ADB/UIAutomator e confere os registros pela API real. Reutiliza os auxiliares de `scripts/android/verify-integrated.py`; executado na raiz pelo workflow Android com foco `roles`.

Exige emulador, APK instalado, API local, `DATABASE_URL` local com banco terminado em `_test` e contas ficticias. Nao executar contra producao. O resultado em `emulator-evidence/roles-result.json` descreve os passos efetivamente concluidos e os limites de OAuth, aparelho fisico e cobranca externa.
