# Verificação das dependências

[check-dependencies.cjs](check-dependencies.cjs) compara as dependências instaladas com as versões exatas do `package.json` e a matriz nativa do Expo instalado pelo lockfile.

Executar `pnpm check` dentro de `mobile`, ou `pnpm --dir mobile check` na raiz. Requer dependências já instaladas e produz JSON de diagnóstico. Não altera versões nem consulta serviços externos.

`pnpm check:updates` é diferente: consulta as recomendações online do Expo. Uma atualização exige avaliar compatibilidade, recompilar e testar; não atualizar automaticamente um SDK somente para deixar essa consulta sem avisos.

[Aplicativo](../README.md)
