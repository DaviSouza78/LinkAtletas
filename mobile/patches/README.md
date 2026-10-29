# Patches de dependências

O pnpm aplica [deepmerge@4.3.1.patch](deepmerge@4.3.1.patch) durante a instalação, com conteúdo e hash registrados no manifesto e lockfile. Usar `pnpm install --frozen-lockfile`; não editar `node_modules` manualmente.

O patch trata [GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4), sem versão corrigida publicada na revisão de 29/10/2026. Bloqueia `__proto__`, `constructor` e `prototype` ao copiar origem e destino, escreve propriedades com `Object.defineProperty` e falha de forma restritiva na consulta do protótipo. Abrange o fonte e os bundles CJS/UMD distribuídos pelo pacote.

[dependencies.test.ts](../tests/dependencies.test.ts) reproduz a exploração com objetos nulos, primitivos e objetos sem protótipo, verifica o bundle UMD e preservação de configuração, arrays e símbolos. O teste falhou com o pacote original e passou com o patch. Executar `pnpm exec vitest run tests/dependencies.test.ts` em `mobile`.

O número original da versão é preservado. Por isso o Dependabot e `pnpm audit` podem continuar exibindo esse alerta, embora o código instalado esteja corrigido para os cenários testados. Não há regra para ignorar ou encerrar o aviso. Quando houver release corrigido compatível, substituir o patch pela atualização e repetir os testes.

Os overrides do manifesto fixam `node-forge` em 1.4.2 e o Zod da CLI Expo em 4.6.6. A compatibilidade das schemas da CLI é verificada pela suíte, além das verificações de tipos, exportação e compilação Android. Atualizações do SDK devem reavaliar esses overrides e este patch.
