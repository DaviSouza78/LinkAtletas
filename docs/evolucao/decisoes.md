# Decisões, dificuldades e mudanças de escopo

Revisão documental de 24/10/2026: a [auditoria aplicada à ERS v2.4](revisao-ers-aplicada-2026-10-24.md) integra os requisitos nas seções do template, desenvolve os casos iniciais com evidências existentes e substitui figuras/sumário. Apêndices duplicados removidos; original da Sprint 1 preservado. Sem mudança no código da aplicação ou nova homologação externa nesta revisão.

Data: 14/10/2026. [Proposta aprovada por Lucca](../superpowers/specs/2026-10-14-expansao-completa-design.md). Este registro não atribui decisões ao professor ou a integrantes sem evidência.

| Decisão | Motivo e efeito |
|---|---|
| Preservar `sprint-2`, ampliar em `evolucao-completa` | Mantém entrega web inicial e permite revisar o novo incremento separadamente; migrations cumulativas preservam dados |
| Node/Fastify/PostgreSQL e React existentes | Evita reconstrução; app Expo compartilha API e contratos |
| Financeiro `academic` ou `asaas` explícito | Demonstração sem cobrança continua disponível e identificável; operação financeira exige credenciais reais no servidor |
| Asaas Checkout hospedado | Sem formulário próprio de cartão; webhook autenticado e único confirma evento, nunca redirect |
| Timeout financeiro vira resultado incerto | Evita repetir criação/cancelamento financeiro sem saber o resultado; conciliação por referência e estado persistido |
| Comissão em basis points, valores em centavos | Evita aritmética monetária baseada em texto; estimativa de participação difere de split liquidado |
| Um ciclo vigente por par | Encerrados/recusados podem gerar novo ciclo sem reapontar treinos antigos |
| S3 privado local SeaweedFS e SMTP Mailpit | Exercita serviços reais isolados sem depender de nuvem/contas nem enviar e-mail a terceiros |
| AES-256-GCM com chave fora do Git | Cifra conteúdo privado e mídia; chave precisa acompanhar backup por canal protegido e não pode ser regenerada para dados existentes |
| Recuperação com token no fragmento | Browser lê token sem enviá-lo na URL HTTP inicial; hash/expiração/uso único no banco e sessões invalidadas |
| CREF manual com prazo e auditoria | Não recebido contrato/API autorizada para consulta oficial; regex ou seed não substituem verificação |
| Review por ciclo e sete dias mínimos | Evita avaliações sem relação; parâmetro de teste não altera silenciosamente a regra padrão |
| WS depois do commit, histórico no banco | Mensagem não depende da memória do processo; fanout atual é de uma instância, broker futuro para distribuição |
| Agenda local primeiro, referência Google opcional | Persistência/conflitos independem de OAuth; criação externa somente por ação explícita; alterações locais ainda não sincronizam bidirecionalmente |
| Expo com token SecureStore | Cookie continua na web, token explícito no cliente nativo; bundle não é evidência de APK/IPA/dispositivo |
| IDs RF originais mantidos | ERS original detalha somente 24 RF; novos requisitos usam RF-A para evitar inventar RF-25–32 |

## Dificuldades e solução aplicada

Banco inicial tinha unicidade permanente do par atleta/treinador. A migração substitui por unicidade parcial de ciclo vigente e mantém os relacionamentos históricos. A coluna de correlação financeira ganhou migração aditiva de compatibilidade, evitando depender da reaplicação de migration já registrada.

Campos privados existentes estavam em JSON/texto legível. Helpers de criptografia e payload privado permitem migração/leitura sem apresentar hash de senha como se fosse cifra de métricas. A chave local é gerada em arquivo ignorado; produção exige configuração explícita. Perder a chave compromete a recuperação e deve ser prevenido no procedimento de backup.

Mensagens, mídia, agenda e cobranças precisam de autorização por vínculo em cada chamada. Foram mantidas validações de participante, papel, estado e origem; proteção não depende de esconder menus. Sessão WebSocket é revalidada e reconexão recupera histórico. Cobranças com estado incerto não recebem retentativa de criação indiscriminada.

Ambiente não forneceu conta Asaas, provedor oficial CREF, SMTP externo, S3 hospedado, domínio nem credenciais de lojas. Código e testes controlados avançam; ativação/homologação externa continuam pendentes. Java/Android SDK e Xcode não foram identificados no início; compilar/exportar JavaScript não permite afirmar execução nativa em dispositivo.

## Mudanças em relação à proposta original

Atualização de 23/10/2026: a equipe definiu a conferência manual de CREF e solicitou adequar a ERS. RF-04, UC-02 e RN-02 descrevem consulta humana na fonte oficial e decisão administrativa auditada. Não há consulta automática implementada; ela passa a evolução futura, sem condição de API para concluir o requisito atual. A versão 2.3 consolida a definição de escopo pela equipe e retira pendências de aceite docente para essas alterações.

A pesquisa consultou a [orientação oficial do CONFEF](https://faq.confef.org.br/faq/pdf.php?artlang=pt-br&cat=12&id=8) e a [consulta pública do CREF/SP](https://cref-sp.implanta.net.br/servicosOnline/Publico/ConsultaInscritos). Não foi localizada API pública documentada adequada à integração; não se afirma inexistência de serviço restrito. Consulta pública em formulário não é, por si só, documentação de API. Aprovação exige conferir titularidade e situação, não apenas formato de número.

A ERS atual conserva o histórico com data, versão, descrição e autor para posterior transferência ao template obrigatório. A ERS original da Sprint 1 permanece inalterada. A matriz mantém a denominação Eletiva I, conforme o padrão solicitado.

Disponibilidade compõe nota e não é filtro rígido/reserva; a agenda de consultorias faz a reserva efetiva. Match usa regras explicáveis, sem IA treinada. Contratação inicia vínculo e depois checkout, em vez de pré-autorização de cartão antes do aceite. Documento profissional é opcional no formulário implementado, com texto/evidência obrigatórios; política de exigir documento real pode ser revisada antes da operação pública. Aprovação sem prazo informado usa validade padrão do servidor, visível no registro. Autosave contínuo, biblioteca pública de mídia e escala distribuída ainda não estão homologados.

## Publicação e participação

Na validação foram reproduzidas três disputas reais de bloqueio no PostgreSQL: edição de perfil aguardando conta eliminada, login aguardando troca de senha e correção aguardando arquivo eliminado. O servidor revalida a conta/arquivo dentro da transação e nega a operação que ficou obsoleta. Os [testes](../../tests/integration/privacy-races.test.ts) verificam que dados/sessões/feedback não reaparecem após a mudança. Consentimentos da web receberam estado visual imediato enquanto aguardam confirmação, preservando rollback de erro e verdade persistida no servidor.

O trabalho foi inicialmente solicitado em clone local porque Lucca ainda não era contribuidor do repositório original. Posteriormente, Lucca confirmou a colaboração e autorizou explicitamente commits e publicação no GitHub. Os commits foram enviados, o PR #1 integrado e a CI aprovada; ver [registro de publicação](publicacao.md). Os commits usam a identidade fornecida por Lucca; não comprovam horas/revisão dos demais integrantes. Cada integrante precisa registrar sua participação e realizar sua entrega acadêmica conforme orientação do professor.

Na CI, foram corrigidos cancelamento de consultas web após navegação e precedência das variáveis de desenvolvimento sobre a configuração TLS gerada. O build APK foi executado no runner Linux, dispensando instalação local de JDK/SDK. A primeira tentativa de emulador falhou porque as ferramentas Android não estavam no PATH; o workflow passou a localizar explicitamente o diretório do SDK e limitar o tempo de espera. Resultados remotos e limites ficam no relatório, sem converter tentativas em aprovação.

Uma execução posterior revelou o indicador de chat em “Reconectando” no Firefox após a abertura de uma conexão válida: o fechamento atrasado do socket descartado pelo StrictMode ainda alterava o estado da tela. Os callbacks agora ignoram efeitos desmontados. O cenário E2E de chat força essa ordem de eventos no navegador, verifica o indicador e mantém a troca real de mensagens; não foi acrescentado retry para ocultar a falha. O emulador também recebeu diretórios AVD explícitos e PATH compartilhado entre etapas.

## Revisão de 15/10/2026

Todos os oito arquivos do diretório original foram inventariados; as duas propostas são cópias idênticas. Originais foram preservados. Foram corrigidos o DER físico (45 FKs), cardinalidade de documento de verificação, chamadas dos diagramas de sequência e identificadores repetidos dos casos de uso. O SVG de casos de uso agora é gerado da fonte PlantUML, evitando divergência entre texto e imagem. O [dicionário](dicionario-dados.md) registra todas as tabelas/colunas/índices sem dados de usuários.

O Docker foi recuperado preservando diretórios de runtime defeituosos para inspeção, sem reset ou exclusão de volumes. O ajuste de compatibilidade do `cmd.exe` foi salvo antes de remover a exigência indevida de elevação que bloqueava pnpm. A saúde dos serviços e os testes posteriores são a evidência da recuperação.

Um perfil Android local separado permite demonstração standalone por USB/ADB, com HTTP somente em loopback e endereço do emulador. Produção continua HTTPS. O teste nativo usa APK instalado e PostgreSQL/SMTP/S3 reais; preferências de fixture e ações do treinador são preparadas via API, e a elegibilidade de review é reduzida só no banco `_test`. Os passos aprovados do APK têm registro próprio; não equivalem a aparelho físico/iOS ou sandbox financeiro.

Compartilhamento nativo agora elimina a cópia temporária também se download/escrita falhar parcialmente. Dois testes de regressão verificam essa limpeza. O backup foi corrigido para usar a chave local existente quando a variável de ambiente está vazia; duas regressões verificam fallback e preservação do arquivo diante de chave inválida. Dependências web/API e uuid do build móvel foram atualizados; dois alertas sem correção publicada do ecossistema Expo estão descritos na [auditoria](seguranca-dependencias.md).

As divergências CREF automático, IA, PostgreSQL único, nuvem e Android/iOS foram confrontadas com a proposta e ERS originais. As decisões de escopo são registradas pela equipe, preservando a distinção entre implementado, testado e futuro. Nenhuma assinatura de integrante, comprovação de participação, submissão acadêmica ou homologação externa foi fabricada.

Na retomada de 20/10, os sockets inválidos voltaram a impedir a partida do Docker após a troca de sessão do Windows; os diretórios de runtime foram novamente preservados para recriação, mantendo os mesmos volumes. O teste Android recebeu foco opcional de diagnóstico de treino, verificação do campo realmente focado antes de digitar, coordenadas com sinal e fechamento de teclado condicionado à sua visibilidade. Gestos mais lentos evitam pular cartões longos de consentimento. O diagnóstico isolado não é registrado como ensaio completo.

No Windows WebKit, ações de múltiplos contextos concluíram individualmente, mas a jornada inteira excedeu 90 segundos. O orçamento dessa única jornada foi ajustado para 180 segundos nesse sistema; limites individuais e zero retries permanecem. No teste de chat, a emissão tardia do callback descartado é controlada explicitamente porque o WebKit pode não emitir o evento nativo de fechamento durante conexão inicial. A API deve estar saudável através do proxy antes do primeiro cenário.

O ensaio Android revelou também uma incompatibilidade de upload: o Expo instala seu `fetch` global, cujo serializador multipart aceita bytes de `File`/`Blob`, mas rejeita o objeto legado de React Native com apenas `uri`. O cliente passou a usar `File` de `expo-file-system`, mantendo o nome escolhido. A regressão confere nome, MIME, bytes e autenticação; a suíte móvel passou para 22 testes. Essa alteração exige novo APK e novo ensaio; o hash do binário anterior não representa o código corrigido. Referências: [fetch do Expo](https://docs.expo.dev/versions/latest/sdk/expo/#expofetch-api) e [upload com File](https://docs.expo.dev/versions/latest/sdk/filesystem/#uploading-files-using-expofetch).

A automação passou a selecionar o nome no seletor DocumentsUI em lugar do ícone de prévia, e a fixture PNG inválida foi substituída por imagem com CRC válido. Um travamento do Pixel Launcher do runner foi identificado separadamente: somente o diálogo desse launcher é fechado e registrado como evento de infraestrutura; falhas do LinkAtletas não são descartadas.

Na conferência de 21/10, a página pública ainda anunciava mais de 12 modalidades e uma média fictícia de avaliações, embora o catálogo tenha cinco modalidades. A contagem foi vinculada ao catálogo compartilhado, a média removida e o gráfico marcado como ilustrativo. Textos de CREF agora descrevem a conferência manual realizada pela administração. Também foram corrigidos overflow, colunas e navegação móvel da página pública, preservando os estilos autenticados por seletores específicos de `.landing`: [verificação em Chrome](evidencias/chrome-landing-revisada.json).

A conferência final corrigiu uma divergência do resumo de segurança: três avisos do Vite ainda constavam no registro. Vite foi atualizado para 8.2.4 e a auditoria repetida confirmou zero alertas na raiz, preservando os dois avisos móveis sem correção oficial. O servidor Vite passou a ouvir somente em 127.0.0.1; a conexão Android usa o túnel USB. Novos patches recomendados pelo catálogo online do Expo são consultados separadamente; a CI verifica as versões instaladas contra a matriz do SDK fixado, para não confundir atualização disponível com incompatibilidade do APK que passou nas 18 etapas.
