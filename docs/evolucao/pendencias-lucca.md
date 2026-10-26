# Pendências de Lucca e do grupo

Revisão atualizada em 26/10/2026. Os nove entregáveis têm referências no [checklist](checklist-sprint-2.md); a [publicação](publicacao.md) identifica os commits e resultados. As decisões de escopo são da equipe; homologações de terceiros e envio acadêmico têm seus próprios registros. O [registro atual da nuvem](implantacao-2026-10-26.md) detalha serviços, testes remotos, APK e pendências de produção.

## Resolvido nesta revisão

- [x] Recuperar Docker Desktop sem apagar bancos, volumes ou chave; PostgreSQL, SMTP e S3 saudáveis, migrations e API verificadas: [ambiente](evidencias/ambiente-local-revisado.json).
- [x] Corrigir a exigência indevida de elevação do `cmd.exe` que bloqueava scripts pnpm; configuração anterior salva fora do repositório.
- [x] Revisar todos os oito arquivos originais e registrar divergências: [revisão](revisao-materiais.md).
- [x] Criar checklist por serviço externo com necessidade na Sprint 2, alternativa local e homologação: [serviços](servicos-externos-sprint-2.md).
- [x] Gerar APK standalone conectado à API local por USB, sem depender de contratar hospedagem: [manual](manual-apk-local.md). Ensaios e limites estão na [verificação móvel](evidencias/mobile-verificacao.md).
- [x] Corrigir limpeza de cópias privadas, uso da chave existente pelo backup e dependências web/API; manter explícitos os alertas móveis sem correção oficial: [auditoria](seguranca-dependencias.md).

## Antes de entregar ao professor

- [x] Registrar a conferência **manual de CREF** como requisito atual na [ERS](ERS-v2.md), conforme decisão da equipe. A automação permanece como evolução futura.
- [x] Documentar os recortes definidos pela equipe: match por regras, PostgreSQL único e limites de Android/iOS e nuvem; manter evoluções no backlog sem apresentá-las como implementadas.
- [x] Relacionar a contribuição da **Eletiva I** e suas evidências na [matriz de UCs](rastreabilidade.md).
- [ ] Cada integrante revisar a demonstração, registrar sua participação real e fazer sua própria entrega no ambiente acadêmico. O documento de convivência exige anexar **e concluir o envio**. Prazo do roteiro: **26/10/2026**; conferir eventuais atualizações na disciplina.

## Quando houver homologação externa ou operação pública

- [ ] Fornecer conta sandbox Asaas/carteira/webhook e conferir cobrança de teste, split, cancelamento e conciliação. Hoje os testes financeiros usam servidor HTTP controlado; o modo acadêmico não cobra.
- [ ] Se a automação de CREF for retomada como evolução, confirmar fonte oficial e condições de integração; ela não é requisito do aceite atual do RF-04.
- [x] Armazenamento privado Tigris criado, com chaves e buckets separados por ambiente, variáveis na Vercel e [testes reais de S3](evidencias/tigris-2026-10-26.json). Isso não conclui a implantação da aplicação.
- [x] Configurar Neon, Tigris e Brevo, aplicar migrações e conferir fluxo principal e recuperação de senha em Preview real. [Evidências e limites](implantacao-2026-10-26.md).
- [ ] Concluir a validação da produção pública e ativar o agendador após os testes. O Preview não substitui a conferência do domínio de produção.
- [ ] Configurar Google OAuth/Agenda/Meet se exigido; agenda própria já funciona sem ele. Sincronização bidirecional permanece evolução.
- [ ] Validar procedimentos/textos de privacidade e retenção com o responsável antes de receber dados reais.

O [checklist de serviços](servicos-externos-sprint-2.md) detalha critérios e variáveis. Configurar secrets no servidor/provedor, nunca no chat, código ou aplicativo. Não é necessário contratar todos esses serviços para a demonstração local.

## Hardware e distribuição

- [ ] Conectar aparelho Android autorizado para homologação física, incluindo TalkBack, texto ampliado, rede intermitente e compartilhamento do sistema. Não havia aparelho físico conectado; emulador não comprova todos os fabricantes.
- [ ] Para iOS, disponibilizar Mac/Xcode ou serviço autorizado e dispositivo; fonte/bundle não comprovam IPA nem uso em iPhone.
- [ ] Para lojas, fornecer contas, certificados e chave de distribuição. O APK usa assinatura de desenvolvimento e não foi enviado às lojas.

## Manutenção acompanhada

- [ ] Atualizar `node-forge`/`braces` transitivos do Expo quando os fornecedores publicarem correções; dois alertas altos permanecem no tooling de build, com exposição delimitada na [auditoria](seguranca-dependencias.md). Nenhum alerta foi suprimido.

Autosave contínuo, biblioteca pública de mídia, modelo treinado, broker/autoescala e sincronização Google bidirecional continuam no [backlog](backlog.md). Commits de Lucca não comprovam participação de outros colegas.
