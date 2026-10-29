# Evidências Android anteriores

Esta pasta reúne os registros Android utilizados na documentação da Sprint 2 e distingue compilação, inicialização e percurso integrado. O [registro de verificação móvel](mobile-verificacao.md) descreve o contexto dos ensaios.

- [Testes controlados do cliente](mobile-tests.json), [compatibilidade do SDK fixado](mobile-compatibility-locked.json) e [bundles](mobile-bundles.json): verificações de código e preparação, sem comprovar uso físico.
- [Resultado integrado histórico](../android-integrated-result.json): percurso contra API e serviços locais, no endereço preservado para a ERS.
- [Registro do ensaio no GitHub](github-android-integrated.json): identificação da execução do APK local.
- [Inicialização com API HTTPS](android-nuvem-2026-10-26.json) e [captura correspondente](android-nuvem-inicializacao-2026-10-26.png): comprovação específica da inicialização remota.
- Arquivos `android-integrated-*.png`: capturas do percurso local. Os dumps XML e logs de diagnóstico intermediários são recuperáveis pelo [histórico do projeto](https://github.com/DaviSouza78/LinkAtletas/tree/094ed35704a4620eb358e217b7ee7b1c5cda22e0/docs/historico/README.md).

As verificações posteriores à ampliação dos três perfis ficam junto ao aplicativo, em [mobile/docs/evidencias/android](../../../mobile/docs/evidencias/android/README.md). Cada registro tem sua própria fonte e alcance. OAuth real, dispositivo físico e lojas dependem de verificações específicas; compilação e emulador não substituem essas etapas.

[Índice das evidências](../README.md)
