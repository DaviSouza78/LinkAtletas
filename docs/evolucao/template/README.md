# ERS no template original

Arquivo para revisão da equipe: [ERS-template-original-atualizada.pdf](../ERS-template-original-atualizada.pdf), versão 2.3.

A cópia parte diretamente da [ERS da Sprint 1](../../referencias/ERS-Sprint-1-original.pdf), preservada sem alteração. Não foi encontrado o Word editável dessa fonte. Por isso, esta tentativa atualiza o PDF diretamente; não é uma conversão para Word nem uma reconstrução do template.

As 47 páginas iniciais mantêm dimensões, ordem, imagens, títulos e posições dos elementos fora das áreas atualizadas. Os campos corrigidos conservam a família, o tamanho e a posição de texto do campo de origem. O histórico usa as linhas disponíveis da tabela original e uma linha adicional com o mesmo padrão. As informações consolidadas da versão atual entram como continuação da seção 7, Apêndices, usando Arial e os tamanhos de texto do documento original. Não houve redução de fonte para acomodar conteúdo.

Atualizações pontuais incluem versão, histórico, conferência manual de CREF, PostgreSQL, contratação antes do checkout, auditoria, gestão de pagamento no provedor, rascunho explícito, prazo da Sprint 2 e cadastro de treinador nos testes. Os apêndices incluem os requisitos adicionais, fluxos, regras, cenários, estados, evidências e limites da [fonte atual](../ERS-v2.md). Estimativas financeiras e elementos históricos preservados não comprovam contratação de serviços ou homologação externa.

## Reprodução e verificação

Usar Windows com as fontes Arial, Arial Bold e Times New Roman instaladas, Python, PyMuPDF e Pillow. Executar `python -X utf8 scripts/update-template-pdf.py` a partir do repositório. O script aplica os textos de [atualizacoes.json](atualizacoes.json) sobre os campos do PDF original, lê a fonte Markdown para os apêndices e gera o PDF de revisão.

O processo falha se um campo não for identificado, se o texto exceder o espaço disponível ou se houver diferença visual fora das áreas atualizadas nas páginas originais. O [registro verificável](../evidencias/ers-template-verificacao.json) informa hashes, páginas e comparação visual. As imagens temporárias para inspeção ficam na pasta `linkatletas-ers-template-review` do diretório temporário do Windows. Nenhum dado fictício é apresentado como consulta real ao conselho.

O PDF original e a ERS editável atual permanecem disponíveis. Esta cópia permite avaliar a apresentação antes de adotá-la como documento final da entrega.
