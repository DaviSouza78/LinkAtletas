# Pendências de Lucca e do grupo

Revisão de 20/10/2026. Os nove entregáveis têm referências no [checklist](checklist-sprint-2.md); a [publicação](publicacao.md) identifica os commits e resultados. Os artefatos não substituem aceite docente, homologação de terceiros ou envio acadêmico.

## Resolvido nesta revisão

- [x] Recuperar Docker Desktop sem apagar bancos, volumes ou chave; PostgreSQL, SMTP e S3 saudáveis, migrations e API verificadas: [ambiente](evidencias/ambiente-local-revisado.json).
- [x] Corrigir a exigência indevida de elevação do `cmd.exe` que bloqueava scripts pnpm; configuração anterior salva fora do repositório.
- [x] Revisar todos os oito arquivos originais e registrar divergências: [revisão](revisao-materiais.md).
- [x] Criar checklist por serviço externo com necessidade na Sprint 2, alternativa local e homologação: [serviços](servicos-externos-sprint-2.md).
- [x] Gerar APK standalone conectado à API local por USB, sem depender de contratar hospedagem: [manual](manual-apk-local.md). Ensaios e limites estão na [verificação móvel](evidencias/mobile-verificacao.md).
- [x] Corrigir limpeza de cópias privadas, uso da chave existente pelo backup e dependências web/API; manter explícitos os alertas móveis sem correção oficial: [auditoria](seguranca-dependencias.md).

## Antes de entregar ao professor

- [ ] Conferir com o professor a contingência de **CREF manual**, pois a ERS original previa automatização na Sprint 2. A proposta admite risco de indisponibilidade de API, mas o aceite dessa mudança não foi fornecido.
- [ ] Alinhar a diferença entre **IA solicitada na proposta e o match atual por regras**, além do recorte Android/iOS, nuvem e PostgreSQL único. Registrar a decisão docente.
- [ ] Informar nome e competências da **Eletiva I** para completar a [matriz de UCs](rastreabilidade.md).
- [ ] Cada integrante revisar a demonstração, registrar sua participação real e fazer sua própria entrega no ambiente acadêmico. O documento de convivência exige anexar **e concluir o envio**. Prazo do roteiro: **26/10/2026**; conferir eventuais atualizações na disciplina.

## Quando houver homologação externa ou operação pública

- [ ] Fornecer conta sandbox Asaas/carteira/webhook e conferir cobrança de teste, split, cancelamento e conciliação. Hoje os testes financeiros usam servidor HTTP controlado; o modo acadêmico não cobra.
- [ ] Obter acesso autorizado para CREF automático, se mantido no aceite.
- [ ] Fornecer infraestrutura/domínio, SMTP externo e S3 privado hospedado se a entrega acordada exigir URL pública/nuvem. TLS local testado não equivale a site implantado.
- [ ] Configurar Google OAuth/Agenda/Meet se exigido; agenda própria já funciona sem ele. Sincronização bidirecional permanece evolução.
- [ ] Validar procedimentos/textos de privacidade e retenção com o responsável antes de receber dados reais.

O [checklist de serviços](servicos-externos-sprint-2.md) detalha critérios e variáveis. Configurar secrets no servidor/provedor, nunca no chat, código ou aplicativo. Não é necessário contratar todos esses serviços para a demonstração local.

## Hardware e distribuição

- [ ] Conectar aparelho Android autorizado para homologação física, incluindo TalkBack, texto ampliado, rede intermitente e compartilhamento do sistema. Não havia aparelho físico conectado; emulador não comprova todos os fabricantes.
- [ ] Para iOS, disponibilizar Mac/Xcode ou serviço autorizado e dispositivo; fonte/bundle não comprovam IPA nem uso em iPhone.
- [ ] Para lojas, fornecer contas, certificados e chave de distribuição. O APK usa assinatura de desenvolvimento e não foi enviado às lojas.

## Manutenção acompanhada

- [ ] Atualizar `node-forge`/`braces` transitivos do Expo quando os fornecedores publicarem correções; dois alertas altos permanecem no tooling de build, com exposição delimitada na [auditoria](seguranca-dependencias.md). Nenhum alerta foi suprimido.

Autosave contínuo, biblioteca pública de mídia, modelo treinado, broker/autoescala e sincronização Google bidirecional continuam no [backlog](backlog.md). Commits de Lucca não comprovam participação de outros colegas nem aprovação docente.
