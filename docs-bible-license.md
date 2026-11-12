# Bíblia integrada — conteúdo e licença

## Tradução ativa

A aba **Bíblia** usa a **Bíblia Livre (BLIVRE, 2018)**, em português do Brasil. O catálogo oficial da tradução lista os 66 livros e o pacote importado contém 1.189 capítulos e 31.102 versículos. **Ela não é a King James Fiel 1611.**

A tradução é © 2018 de Diego Santos, Mario Sérgio e Marco Teles e está disponibilizada sob a Licença Creative Commons Atribuição 4.0 Brasil (CC BY 4.0). A licença permite compartilhar e redistribuir o texto em qualquer formato, desde que os créditos e a fonte sejam informados. Se o texto for alterado, a alteração deve ser indicada sem sugerir endosso dos autores.

**Atribuição exibida no aplicativo:** “Bíblia Livre (BLIVRE), Copyright © 2018 Diego Santos, Mario Sérgio e Marco Teles. Licença Creative Commons Atribuição 4.0 Brasil (CC BY 4.0). Fonte: eBible.org.”

- Ficha e licença da tradução: <https://ebible.org/find/details.php?id=porbr2018>
- Aviso oficial de copyright e créditos: <https://ebible.org/porbr2018/copyright.htm>
- Índice oficial dos livros: <https://ebible.org/porbr2018/>
- Pacote HTML de origem: <https://ebible.org/Scriptures/porbr2018_html.zip>

O importador `scripts/import-blivre-html.py` transforma o pacote oficial em um JSON por livro, preservando o texto dos versículos e removendo apenas marcadores de navegação/notas. Os dados ficam em `src/lib/bible-livre/`. A função autenticada `getBibleChapter` carrega o livro no servidor e devolve somente o capítulo solicitado; a Bíblia integral não é incluída no bundle inicial do navegador.

A conversão organiza o conteúdo para leitura digital e mantém a redação da fonte. Qualquer correção textual futura deve ser identificada e documentada conforme a licença. Esta alteração não habilita narração em áudio.

## Histórico de fonte

A implementação anterior consultava `bible-api.com` para uma suposta tradução “Almeida”. Como não havia licença verificável para redistribuição no aplicativo, essa integração foi desativada e não é usada pela BLIVRE.
