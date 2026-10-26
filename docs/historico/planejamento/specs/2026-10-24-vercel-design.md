# Implantação na Vercel

Escopo autorizado por Lucca: prosseguir com interface e API na Vercel e conectar os serviços persistentes na nuvem. Railway permanece uma alternativa; não é dependência desta implantação.

## Arquitetura

Usar o preset Fastify e uma entrada `server.ts` na raiz, reutilizando a aplicação existente e servindo o build Vite em `dist`. Manter o mesmo domínio e as rotas `/api`, cookies seguros, validação de origem e arquivos privados. PostgreSQL será conectado pelo Neon no painel. O armazenamento continuará compatível com S3, sem converter arquivos privados em públicos; SMTP será um serviço externo.

O processo contínuo de jobs permanece no ambiente local e em containers. Na Vercel, uma rota GET protegida por `CRON_SECRET` executará os jobs com trava de PostgreSQL, sem depender de timers entre requisições. A frequência do agendador precisa ser definida conforme o plano; não configurar uma execução diária como se atendesse recuperação de senha em tempo adequado.

WebSockets continuam disponíveis. A interface também consultará periodicamente o estado persistido para não depender da entrega em memória entre instâncias diferentes. Não prometer entrega instantânea entre instâncias.

## Alternativas consideradas

1. Fastify servindo API e interface: mantém o domínio e a aplicação atual, recomendado para esta etapa.
2. Vite com função separada: exige roteamento adicional e tratamento da entrada WebSocket.
3. API em container externo: mantém os timers, mas acrescenta outra hospedagem.

## Verificação e limites

Verificar TypeScript, build, autenticação da rota agendada, exclusão mútua dos jobs e preservação do modo local. Rodar integração quando Docker ou banco de teste estiver disponível. Não executar testes destrutivos no Neon de produção. Validar publicamente saúde, login, permissões, arquivos, e-mails e conversas após configurar as credenciais.

Não publicar esta preparação na branch principal antes da configuração dos serviços: a aplicação recusa credenciais ausentes em produção. Não copiar a base local ou gerar contas públicas de demonstração automaticamente.
