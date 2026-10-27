# Roteiro de apresentação da Sprint 2

**Ordem:** ERS → GitHub → arquitetura e serviços → site → testes/API → decisões e próximos passos.
**Tempo sugerido:** 12–15 minutos. Usar os itens abaixo como lembrete, sem ler os documentos inteiros.

## Antes de começar

- [ ] Abrir [ERS completa em PDF](ERS-template-original-atualizada.pdf), [GitHub](https://github.com/DaviSouza78/LinkAtletas) e [site](https://link-atletas.vercel.app).
- [ ] Preparar contas fictícias e separar atleta, treinador e administrador em perfis/navegadores diferentes.
- [ ] Deixar [checklist da entrega](checklist-sprint-2.md), [diagramas](diagramas.md), [backlog](backlog.md) e [evidências](implantacao-2026-10-26.md) acessíveis.
- [ ] Não mostrar senhas, arquivos `.env`, chaves ou URLs de conexão com credenciais.

## 1. ERS — contexto e requisitos

- Objetivo do LinkAtletas e problema atendido.
- Atores: atleta, treinador e administrador.
- Requisitos funcionais, não funcionais e regras de negócio.
- CREF: conferência manual e auditada; automação como evolução.
- Diagramas: casos de uso, classes, DER e sequências.
- Casos de teste e histórico das revisões.
- Versão completa no template; síntese auxiliar não substitui o PDF completo.

## 2. GitHub — código e organização

- README e índice da documentação.
- Código: `src`, `server`, `shared` e `mobile`.
- Commits, pull requests e integração na `main`.
- Actions: build, testes, documentação e compilação Android.
- Checklist: referências dos nove entregáveis.

## 3. Arquitetura, banco e serviços externos

**Caminho dos dados:** site/app → API Fastify → PostgreSQL no Neon.

- **Vite + React:** interface web; **Node.js + Fastify:** API.
- **Vercel:** interface e API publicadas no mesmo domínio.
- **Neon:** PostgreSQL na nuvem; contas, perfis, vínculos, treinos e demais registros.
- **Tigris:** documentos e vídeos privados cifrados; banco guarda referências/metadados.
- **Brevo / SMTP:** envio de e-mails, incluindo recuperação de senha.
- **cron-job.org:** chama a rota protegida de tarefas a cada minuto; processa pendências e expirações.
- **Docker local:** PostgreSQL + SeaweedFS + Mailpit para desenvolver e testar.
- **Separação:** produção, Preview e desenvolvimento; dados não sincronizam automaticamente.
- **Independência:** desligar Docker/computador não interrompe o site na nuvem.
- **Asaas:** integração financeira preparada; modo acadêmico sem cobrança real.
- **Google Agenda/Meet:** integração opcional, sem homologação externa presumida.

## 4. Site — fluxo principal de ponta a ponta

1. Página inicial e visualização responsiva no celular.
2. Cadastro/login e preenchimento do perfil do atleta.
3. Treinador submete CREF/evidência.
4. Administrador confere e registra a decisão.
5. Atleta encontra treinador compatível e solicita vínculo.
6. Treinador aceita o vínculo.
7. Treinador cria e publica treino.
8. Atleta registra execução e feedback.
9. Treinador consulta o resultado; atualizar a página para mostrar persistência.

**CREF fictício:** identificar como cenário de teste; não apresentar como habilitação profissional real.

## 5. Complementos e validações

- Mensagens entre as duas contas e notificações.
- Arquivo privado, autorização e consentimento de performance.
- Agenda e avaliações, se houver tempo; avaliação exige elegibilidade do vínculo.
- Campo obrigatório, login inválido e restrições por papel.
- Recuperação de senha; não depender da chegada de e-mail durante a apresentação.
- Financeiro: mostrar claramente o modo acadêmico.

## 6. API, testes e aplicativo

- [Swagger da API](https://link-atletas.vercel.app/api/docs): autenticação, vínculos e treinos.
- [Saúde da API](https://link-atletas.vercel.app/api/health): conexão com PostgreSQL.
- 99 testes de API/unidade aprovados; execução completa de navegador aprovada na CI.
- Evidências de responsividade, permissões, persistência e arquivos de 5/50 MiB.
- Recuperação: token de uso único e revogação de sessões; aceite SMTP não garante caixa de entrada.
- APK: compilado com URL HTTPS, instalado e iniciado em emulador.
- Distinguir evidências locais, Preview e produção; emulador não comprova aparelho físico/iOS.

## 7. Decisões, dificuldades e encerramento

- [Decisões](decisoes.md): CREF manual, PostgreSQL e evolução do escopo.
- Dificuldades: runtime/rotas da Vercel, integrações e limite de upload.
- Solução de upload: partes de 3 MiB, mantendo limite de 50 MiB para vídeo.
- [Backlog](backlog.md): pagamentos reais, dispositivos/lojas e evoluções futuras.
- [Matriz de UCs](rastreabilidade.md) e participação dos integrantes.
- Encerrar voltando ao checklist dos entregáveis.

## Conferência final dos nove entregáveis

- [ ] Código atualizado e versionado → GitHub, commits e PRs.
- [ ] Fluxo principal funcional → demonstração de atleta, treinador e administrador.
- [ ] Banco criado e integrado → PostgreSQL/Neon, DER e persistência.
- [ ] Interface responsiva integrada → desktop/celular e API.
- [ ] Validações e erros → exemplos no site e permissões.
- [ ] Testes com evidências → Actions, resultados e capturas.
- [ ] Documentação da API → Swagger/OpenAPI.
- [ ] ERS, diagramas e backlog atualizados → documentos e histórico.
- [ ] Dificuldades, decisões e escopo registrados → decisões e limitações.

As caixas deste roteiro são lembretes do que mostrar na apresentação, não indicadores de funcionalidades pendentes.
