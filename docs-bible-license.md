# Bíblia integrada — conteúdo e licença

## Situação atual

A área **Bíblia** disponibiliza o catálogo canônico de 66 livros e a navegação por
livro e capítulo, mas **não armazena nem exibe texto bíblico nesta versão**.

A implementação anterior consultava `bible-api.com` para retornar uma suposta
tradução “Almeida”. Não havia, no repositório, uma licença verificável da tradução
nem termos que autorizassem expressamente a redistribuição no aplicativo. Essa
integração foi desativada para não apresentar texto de procedência/licença incerta.

## Pendência para publicação de texto

Antes de ativar um provedor, registrar aqui:

- tradução e edição exatas;
- titular dos direitos ou indicação de domínio público;
- URL da licença/termos que autorize exibição, pesquisa, cópia/compartilhamento e,
  se aplicável, geração/distribuição de áudio;
- atribuição exigida;
- estratégia de armazenamento e retenção.

O texto deve ser servido por uma função autenticada do backend, por capítulo, e
nunca incluído no bundle inicial. Chaves de APIs devem permanecer somente no
ambiente do servidor. A narração permanece desabilitada até que a licença permita
expressamente a transformação/distribuição em áudio.
