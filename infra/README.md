# Infraestrutura

Esta pasta reúne as configurações do armazenamento S3 local e do proxy HTTPS usado na execução com Docker. Os serviços, portas e volumes são definidos nos arquivos Compose da raiz; `infra` fornece os arquivos que esses serviços carregam.

## Arquivos

| Arquivo | Função | Onde é utilizado |
|---|---|---|
| [Caddyfile](Caddyfile) | Configura HTTPS com certificado interno para o ambiente Docker local. | Configuração padrão do serviço `proxy` em [compose.production.yaml](../compose.production.yaml). |
| [Caddyfile.public](Caddyfile.public) | Configura o proxy para um domínio público, com gerenciamento automático de certificados. | Alternativa selecionada pela variável `CADDY_CONFIG_FILE` no Compose de produção. |
| [s3.local.json](s3.local.json) | Define a identidade, as credenciais de desenvolvimento e as permissões do armazenamento compatível com S3. | Serviço `storage` em [compose.yaml](../compose.yaml). |
| [README.md](README.md) | Explica as configurações, seus ambientes e a relação com a aplicação. | Consulta do grupo, instalação e apresentação do projeto. |

## Caddyfile: HTTPS local

O Caddy recebe a conexão HTTPS e encaminha a requisição para `app:3001`, o endereço do servidor dentro da rede Docker. Esse encaminhamento é chamado de **proxy reverso**. Nesse ambiente, a aplicação atende a interface web compilada e a API.

As diretivas do arquivo têm estas funções:

- `admin off`: desativa a API administrativa do próprio Caddy. O painel administrativo do LinkAtletas continua sendo uma funcionalidade da aplicação.
- `skip_install_trust`: evita a instalação automática da autoridade certificadora interna no repositório de certificados confiáveis.
- `auto_https disable_redirects`: desativa a criação automática de redirecionamentos HTTP para HTTPS.
- `SITE_HOST`: define o endereço atendido; o padrão do arquivo é `localhost`.
- `tls internal`: usa um certificado emitido pela autoridade interna do Caddy, apropriado para o ensaio local. A confiança nesse certificado precisa ser configurada no cliente que fará a conexão.
- `encode zstd gzip`: habilita compressão das respostas compatíveis.
- `header`: adiciona HSTS, proteção contra interpretação indevida do tipo de conteúdo (`nosniff`) e a política de referência `same-origin`.
- `reverse_proxy app:3001`: encaminha as requisições para o servidor da aplicação.

O Caddy escuta a porta `443` dentro do container. O Compose publica essa porta em `https://localhost:8443` por padrão, com acesso limitado a `127.0.0.1`. A porta externa é controlada por `HTTPS_PORT` e o endereço de publicação por `PROXY_BIND`.

## Caddyfile.public: domínio público

Esta alternativa conserva o encaminhamento para `app:3001`, a compressão e os cabeçalhos de segurança. A diferença principal é o uso do HTTPS automático para o domínio informado em `SITE_HOST`, em vez de `tls internal`.

`TLS_EMAIL` é o contato usado na configuração do gerenciamento de certificados. A publicação exige domínio, DNS, conectividade e variáveis de ambiente coerentes com o endereço público. A seleção desse arquivo é feita por `CADDY_CONFIG_FILE`; o padrão do Compose continua sendo o arquivo local.

Esse arquivo é uma opção de implantação própria com Docker. Sua presença no repositório não significa que exista um domínio público usando Caddy.

## s3.local.json: armazenamento de desenvolvimento

O serviço SeaweedFS carrega esse JSON em `/config/s3.json` e fornece uma API compatível com S3. A aplicação usa essa API para guardar e recuperar arquivos enviados, como documentos profissionais e mídias de treino.

O conteúdo do JSON define:

- `identities`: identidades autorizadas no serviço de armazenamento.
- `name`: nome da identidade local, `linkatletas-local`.
- `credentials`: par `accessKey` e `secretKey` usado para autenticação. A aplicação precisa utilizar valores correspondentes em `S3_ACCESS_KEY` e `S3_SECRET_KEY`.
- `actions`: permissões de administração, leitura, escrita, listagem e etiquetas (`Admin`, `Read`, `Write`, `List` e `Tagging`). Essa identidade ampla é destinada ao ambiente local.

As credenciais desse arquivo são valores públicos de desenvolvimento. Para uma implantação própria com o Compose de produção, `S3_CONFIG_FILE` aponta para um arquivo privado, com credenciais exclusivas. O comando `pnpm production:init`, definido no [package.json](../package.json), gera `.env.production.local` e `.s3-production.local`, ignorados pelo Git, e preserva arquivos já existentes.

### Onde os dados ficam

O JSON contém a configuração de acesso. Os arquivos enviados ficam no volume Docker `linkatletas_objects`, montado em `/data` no serviço `storage`. O endpoint local é `http://127.0.0.1:8333`.

Os registros relacionais da aplicação ficam no PostgreSQL, no volume local `linkatletas_data`. No Compose de produção, os volumes equivalentes são `production_objects` e `production_database`. Os nomes efetivos dos volumes também recebem o prefixo do projeto Compose.

Os arquivos de `infra` são montados como somente leitura nos containers. A persistência dos dados e dos certificados é feita pelos volumes definidos no Compose.

## Relação com os ambientes do projeto

| Ambiente | Uso desta pasta |
|---|---|
| Desenvolvimento com `compose.yaml` | Usa `s3.local.json` no SeaweedFS. Também inicia PostgreSQL e Mailpit; a interface e a API são executadas pelos comandos de desenvolvimento. |
| Docker com `compose.production.yaml` | Usa `Caddyfile` por padrão e exige um arquivo S3 privado em `S3_CONFIG_FILE`. O nome “production” identifica o modo de execução; a configuração gerada inicialmente é uma demonstração local com HTTPS. |
| Domínio próprio com Docker | Pode selecionar `Caddyfile.public`, após configurar domínio, exposição de rede e os serviços necessários. |
| Implantação documentada na Vercel | HTTPS e execução são atendidos pela Vercel, o PostgreSQL pelo Neon e os objetos pelo Tigris. Essa implantação utiliza as configurações da Vercel e as variáveis dos serviços, em vez destes arquivos locais. |

Para iniciar os serviços de desenvolvimento, execute na raiz do repositório:

```powershell
docker compose up -d --wait
```

Esse comando inicia banco, e-mail de teste e armazenamento. As etapas para executar a aplicação e preparar o ambiente HTTPS estão no [manual de operação](../docs/operacao/manual.md). O [registro da implantação remota](../docs/evidencias/relatorios/implantacao-2026-10-26.md) detalha os serviços e as verificações realizadas na nuvem.

[Visão geral do projeto](../README.md) · [Scripts de operação](../scripts/operacao/README.md)
