# Padrão editorial dos Estudos Bíblicos — Gênesis a Apocalipse

**Projeto:** Caminho Divino / Formação de Pregadores.  
**Corpus:** 66 livros, 1.189 capítulos, respeitando o cânon protestante já configurado em src/lib/content/bible-books.ts.  
**Referência principal:** estudo de Gênesis 1 enviado pelo responsável e sua implementação em src/lib/content/genesis-1-study.ts.

## Compromisso

Cada estudo deve ajudar o aluno a **ler**, **observar**, **compreender**, **interpretar**, **relacionar**, **aplicar** e **ensinar** a passagem. Uma apresentação bonita, uma lista de referências, linguagem devocional ou um grande volume de texto **não substituem** exegese responsável. O estudo não se declara concluído simplesmente porque um arquivo existe, porque o build passou ou porque uma IA produziu JSON.

## Estrutura obrigatória por capítulo (adapte o número de tópicos ao gênero e ao texto)

1. **Leitura integral:** identificação de todos os versículos do capítulo em ordem. Se houver paráfrase/tradução livre própria, rotular como material de estudo, não como tradução bíblica oficial. Se não for possível redigir adequadamente, encaminhar à leitura na Bíblia e jamais apresentar texto inventado como Escritura.
2. **Introdução:** pergunta que o capítulo responde, mensagem principal e objetivos de aprendizagem.
3. **Contexto histórico, geográfico, cultural e literário:** somente o que é sustentado por evidência; mencionar limites e disputas sobre data, autoria ou costumes.
4. **Gênero e estrutura:** narrativa, poesia, lei, profecia, evangelho, carta, apocalíptica; delimitar perícopes e explicar por que esses limites são plausíveis.
5. **Exposição bíblica profunda:** sucessão de perícopes sem lacunas, observações versículo a versículo quando isso fizer sentido, ligações entre frases, personagens, argumentos, palavras e temas; distinguir narração, mandamento, promessa, figura de linguagem e interpretação.
6. **Termos originais relevantes:** hebraico, aramaico ou grego quando oferecem ganho real; verificar transliteração e sentido no contexto. Não inferir doutrinas de uma raiz ou de etimologia isolada.
7. **Teologia e unidade do livro:** o que a passagem revela sobre Deus, humanidade, pecado, aliança, justiça, graça e esperança, sem impor temas alheios ao capítulo.
8. **Referências cruzadas comentadas:** explicar o que cada referência realmente acrescenta, consultando seu contexto; não apenas colecionar links.
9. **Cristo e a história da redenção:** relacionar ao evangelho por conexões textuais/canônicas responsáveis. Distinguir citação explícita no Novo Testamento, tipologia argumentada e aplicação cristã posterior. Evitar ver Jesus de maneira alegórica em todo objeto.
10. **Questões interpretativas:** separar afirmação textual, leitura provável, questão debatida e informação incerta; comparar posições sérias com respeito e clareza.
11. **Erros e usos indevidos:** não inventar datas ou fatos, não converter poesia em garantias automáticas, não atribuir instruções antigas a todos sem contextualização, não usar textos para legitimar violência ou abuso.
12. **Aplicação e meditação:** aplicações concretas derivadas do sentido da passagem; perguntas pessoais sem manipulação emocional.
13. **Resumo e glossário:** síntese verificável e explicações acessíveis de termos técnicos ou culturais presentes no capítulo.
14. **Exercícios e respostas orientadoras:** observação, interpretação, comparação de textos e aplicação; estimular que o aluno confira sua Bíblia.
15. **Oficina do pregador:** tema, proposição/ideia central, objetivo, movimentos expositivos que acompanham a estrutura do capítulo, ilustrações só quando adequadas, transições, conclusão e alertas para interpretações indevidas.
16. **Oração final:** coerente com a passagem; não declarar promessas ou revelações que o texto não oferece.

Uma etapa pode precisar de várias seções. **Não force 26 seções artificiais:** a exigência é cobertura real e profundidade, conforme o gênero e o tamanho do capítulo. Uma genealogia, salmo de lamento, lei ritual e carta apostólica não devem receber o mesmo texto genérico.

## Sinalização editorial

- **Texto afirma / confiança alta:** afirmação claramente presente no texto bíblico.
- **Interpretação provável:** conclusão apoiada no contexto, explicitamente apresentada como interpretação.
- **Questão debatida:** leituras relevantes que merecem comparação honesta.
- **Incerto:** evidência insuficiente; nunca preencher com informação inventada.

A sinalização de confiança deve se referir à afirmação ou bloco, e não transformar toda aplicação pastoral em verdade textual.

## Preservação, inclusão e acessibilidade

- Nunca remover ou sobrescrever um capítulo existente para encaixá-lo no modelo sem análise editorial.
- Complementar seções e campos vazios **preservando trechos válidos**, histórico, IDs de capítulos, progresso, favoritos, leitura em voz alta, pontos salvos e rotas atuais.
- Manter os identificadores do catálogo: genesis-1-criacao ou biblia-{slug}-cap-{n}; usar o índice oficial dos 66 livros.
- Metadados de estudo devem continuar compatíveis com StudyContent, StudyReader e o catálogo CURATED_STUDIES.
- Para novas versões, preferir parágrafos curtos, títulos consistentes, seções navegáveis e referências legíveis no celular. Não duplicar números de seção.
- Para texto bíblico integral, confirmar permissões de uso; a tradução livre indicada no material de Gênesis 1 **não autoriza** copiar traduções protegidas.
- O catálogo de leitura bíblica (bible-livre/*.json) não é sinônimo de um estudo aprofundado por capítulo.

## Critério de publicação por capítulo

O estudo só está **editorialmente aprovado** quando alguém verificou todos os pontos:

- [ ] Livro, capítulo, total de versículos e gênero conferidos na Escritura.
- [ ] Leitura/paráfrase própria verificada, sem versículos omitidos, misturados ou alterados.
- [ ] Todas as perícopes importantes explicadas, sem preencher lacunas com repetições.
- [ ] Contexto e termos originais conferidos; sem história, arqueologia ou referências inventadas.
- [ ] Afirmações textuais distintas das inferências, aplicações e posições debatidas.
- [ ] Referências cruzadas consultadas e explicadas em seu contexto.
- [ ] Conexão com Cristo responsável e não forçada.
- [ ] Aplicações, exercícios, oficina de pregação e oração pertinentes à passagem.
- [ ] IDs, seções, campos, navegação e leitura em voz alta validados no aplicativo.
- [ ] TypeScript, lint, build e testes aprovados; nenhuma regressão no conteúdo existente.
- [ ] Revisão humana de fidelidade bíblica concluída.

**Estados recomendados:** ausente → rascunho → revisão editorial → aprovado → publicado. Não inferir aprovação ou publicação a partir da presença de um arquivo.

## Cobertura, auditoria e prioridade

Rodar, sem alterar os estudos:

    python3 scripts/audit-bible-studies.py --output /tmp/bible-study-audit.md --json-output /tmp/bible-study-audit.json

A auditoria conta cobertura dos 1.189 capítulos e sinaliza problemas estruturais por arquivo, como IDs duplicados, campos vazios e seções esperadas ausentes. Não equivale a uma revisão teológica/gramatical da Bíblia. O relatório deve ser consultado para guiar os lotes de correção.

**Ordem de execução segura:**

1. Registrar a cobertura atual da main, identificar estudos existentes incompletos e preservar o material bom.
2. Revisar capítulos com erros estruturais ou didáticos evidentes, começando pelos mais graves.
3. Completar os capítulos ainda ausentes em lotes pequenos, segundo a ordem canônica, começando pela primeira lacuna verificada. Não sobrescrever arquivos existentes.
4. Para cada lote, validar estrutura, referências, cobertura textual, comportamento do aplicativo e testes; abrir PR para revisão humana. **Não fazer merge automático.**
5. Repetir até Apocalipse 22, então realizar revisão transversal da consistência de nomes, referências, estilo e qualidade de toda a obra.

## Limites dos verificadores automáticos

Não é possível verificar o significado exato de todos os textos ou a correção de uma tradução só com contagem de palavras, títulos, IDs ou testes. Os relatórios automatizados são **triagem**, não certificado teológico. Estudos extensos podem ser ruins; estudos curtos podem ser rigorosos, mas cada capítulo deve ser suficientemente explicado.
