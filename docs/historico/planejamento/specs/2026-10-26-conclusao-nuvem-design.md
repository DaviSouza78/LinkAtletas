# Conclusão da implantação na nuvem

Continuidade do escopo de Vercel aprovado em 24/10 e da autorização de Lucca para concluir os serviços em 26/10. Manter Fastify/Vite, Neon, S3 privado, criptografia e os limites de 10 MiB para documentos/imagens e 50 MiB para vídeos. Não reduzir a ERS para contornar restrições da hospedagem.

## Transferência de arquivos

Enviar arquivos grandes em partes de até 3 MiB pelo servidor autenticado, armazenadas cifradas no S3. Uma sessão temporária no PostgreSQL vincula titular, finalidade, recurso, tamanho, tipo e expiração de uma hora. Cada parte deve ter o tamanho esperado, índice válido e acesso revalidado. Limitar a três sessões abertas por usuário. A finalização bloqueia a sessão, recompõe e valida o arquivo com a mesma assinatura, extensão, consentimento e permissões do upload existente. Retentativas da finalização retornam o mesmo arquivo, sem duplicar mídia. Remover partes após conclusão ou expiração.

Preservar o upload multipart para clientes existentes. Web e Expo passam a usar partes para arquivos acima de 3 MiB. Downloads autenticados usam resposta em stream e suportam Range para reprodução de vídeo. Testar efetivamente o runtime remoto antes de afirmar suporte a arquivos de 50 MiB na Vercel.

Alternativas: upload direto com URL assinada exigiria mudar a criptografia e CORS; API em outro host acrescentaria uma hospedagem. Partes pelo servidor preservam as proteções e o provedor já configurado, ao custo de requisições adicionais.

## Serviços e verificação

Brevo gratuito para SMTP, sujeito à ativação da conta e validação do remetente pelo usuário. Aplicar migrações no Neon sem seed público. Separar Preview e Production. Configurar agendador externo autenticado com frequência compatível com recuperação de senha e registrar a frequência efetiva. Não usar cron diário como garantia de entrega rápida.

Verificar isolamento, expiração, tamanhos, finalização repetida, arquivo inválido, consentimento revogado, cleanup e download. Executar tipos, build, testes de integração e fluxos de navegador; validar saúde, sessão, arquivos e recuperação de senha no domínio publicado antes de promover a implantação. Segredos ficam fora do Git. Não aceitar cobranças nem inventar dados pessoais para ativação de serviços.
