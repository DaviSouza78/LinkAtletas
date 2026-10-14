# Publicação no GitHub

Em 14/10/2026, Lucca confirmou que é colaborador e autorizou publicar os commits em `DaviSouza78/LinkAtletas`. A conta autenticada `luccalck` possui permissão WRITE. A branch [evolucao-completa](https://github.com/DaviSouza78/LinkAtletas/tree/evolucao-completa) preserva os commits da implementação com autoria `Lucca <luccacc.contato@gmail.com>`.

[Pull request #1](https://github.com/DaviSouza78/LinkAtletas/pull/1) aberto para a `main`; integração condicionada aos checks e regras do repositório, sem contornar proteções. [GitHub Actions](https://github.com/DaviSouza78/LinkAtletas/actions) executa instalação, testes, browsers, build, app e TLS. Execução em andamento não é registrada como aprovação.

O workflow Android tenta compilar APK de verificação usando o SDK/JDK do runner e chave de desenvolvimento do template Expo. Nenhum certificado de loja ou conta EAS é utilizado. Configure a variável pública `EXPO_PUBLIC_API_URL` com uma URL HTTPS real antes de usar o binário para testar integrações; sem ela, o domínio `.example` é documental. Compilação, instalação em aparelho e homologação são estados distintos.

APK compilado com sucesso no [run 38654092520](https://github.com/DaviSouza78/LinkAtletas/actions/runs/38654092520), a partir do commit `32d8362`. Artefato `LinkAtletas-APK-verificacao`, SHA-256 `26675fb149bd599daa1beb6d38cdcae6e610171f289065a6f214e87628e0b03c`. A cópia local está em `C:/dev/output/LinkAtletas-APK-verificacao/LinkAtletas-verificacao.apk`. Os fontes nativos não mudaram nas correções web posteriores. O workflow manual `Android emulator smoke` instala esse artefato num emulador isolado e verifica apenas inicialização/tela de login; só registrar aprovação depois da execução.

Pendências humanas: revisar a demonstração com o grupo/professor; identificar a Eletiva I e eventuais formatos/anexos acadêmicos; registrar contribuição individual e realizar a entrega. Serviços externos, domínio e assinatura/distribuição nativa dependem dos acessos do responsável; não enviar segredos pelo chat nem versioná-los.
