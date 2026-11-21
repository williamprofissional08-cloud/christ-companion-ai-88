# PR #363 — 10 frentes de produção sem sobreposição

> Plano de coordenação; **não equivale a 10 tarefas agendadas ativas**. Em 16/11/2026, a conta permite cinco tarefas ativas e as cinco vagas estão ocupadas. Há duas tarefas existentes que trabalham no conteúdo bíblico. A expansão a dez tarefas não foi ativada.

## Objetivo e referência

Repositório: `williamprofissional08-cloud/christ-companion-ai-88`. Branch de integração: `feat/padrao-estudos-genesis-apocalipse` (PR #363). Nunca fazer merge na `main` antes da autorização do proprietário. Não alterar Supabase, usuários, progresso, favoritos ou migrations.

Fotografia verificada em 16/11/2026: **984/1.189 capítulos integrados, 205 ausentes**. Verificar novamente a cobertura real antes de cada execução; os números por faixa são iniciais, e os capítulos concluídos em outra execução deixam de ser pendência.

## Frentes de trabalho — disjuntas

| Frente | Escopo EXCLUSIVO | Pendentes na fotografia |
| --- | --- | ---: |
| 1 | Mateus 18–28; Marcos 1–3 e 5–16 (preservar Marcos 4) | 26 |
| 2 | Lucas 1–24 | 24 |
| 3 | João 1–21 | 21 |
| 4 | Atos 1–28 | 28 |
| 5 | Romanos 1–16; Gálatas 1–6 | 22 |
| 6 | 1 Coríntios 1–16; Filipenses 1–4 | 20 |
| 7 | 2 Coríntios 1–13; Efésios 1–6; Colossenses 1–4 | 23 |
| 8 | 1 Tessalonicenses 1–5; 2 Tessalonicenses 1–3; 1 Timóteo 1–6; 2 Timóteo 1–4; Tito 1–3; Filemom 1 | 22 |
| 9 | Hebreus 1–13; Tiago 1–5; 1 Pedro 1 (preservar 1 Pedro 2–5) | 19 |
| 10 | **Integração, testes, auditoria, saneamento e revisão**: NÃO redigir capítulo em paralelo aos produtores | — |
| **Total** | Cobertura exaustiva dos capítulos pendentes desta fotografia | **205** |

## Arquitetura segura quando houver dez agentes de verdade

1. Cada produtor trabalha em uma **branch exclusiva** `feat/pr363-shard-01` até `feat/pr363-shard-09`, criada a partir do HEAD conhecido do PR. Só cria arquivos de estudos e testes com nomes próprios, sem editar `curated-studies.ts`, arquivos globais, dependências, `main` ou branch do PR.
2. O integrador (frente 10) é o único que lê as nove branches, confere cada arquivo, importa **apenas** novos estudos/testes prontos para o HEAD atualizado de `feat/padrao-estudos-genesis-apocalipse` e altera `curated-studies.ts`. Não mesclar as branches produtoras, nem sobrescrever conteúdo já integrado.
3. Antes de cada integração, consultar novamente HEAD, árvore, catálogo e auditoria; arquivos existentes e slugs já integrados devem ser ignorados. Usar escrita condicional por SHA, em commit atômico quando possível; se HEAD avançou, interromper/recalcular e tentar sobre o novo HEAD **sem force push**.
4. Validar contagem de versículos com `src/lib/bible-livre/{livro}.json`, IDs únicos, integridade de imports/catálogo, testes, lint, TypeScript, build, CI e fidelidade editorial humana. Nunca chamar um resumo ou arquivo vazio de capítulo concluído.
5. **Desativar/reconfigurar as duas rotinas antigas que editam diretamente o PR antes de ativar os dez agentes**, para que não haja concorrência entre arquiteturas. Não é seguro usar ambos os modos simultaneamente.

## Modo atualmente possível com as duas automações já existentes

Enquanto o limite de cinco tarefas ativas impedir a criação de oito tarefas novas:

- A automação **Gênesis → Apocalipse** fica responsável **somente pelas frentes 1–5**, em ordem canônica.
- A automação **Apocalipse → Gênesis** fica responsável **somente pelas frentes 6–9**, em ordem canônica inversa.
- Ambas podem continuar a integração direta na branch do PR com a proteção indispensável de buscar o SHA mais recente de `curated-studies.ts` antes de atualizar. **Nunca** sobrescrever um catálogo se o SHA ficou desatualizado: releia, mescle apenas as entradas de sua própria frente e tente novamente. Não usar force push, renomear estudos nem gerar duplicatas.
- Não buscar capítulos fora da própria faixa depois de completá-la; iniciar revisão editorial de seus próprios estudos e reportar o resultado, sem fazer merge.
- Trabalhar em lotes-alvo de até dez capítulos reais por execução. Se o tempo ou a qualidade impedir dez, registrar apenas os efetivamente integrados e testados; não inventar números nem declarar CI aprovado antes do GitHub Actions.
- Nenhum dos métodos de produção permite dizer que **1.189/1.189 foram revisados humanamente** só porque o catálogo ficou completo.

## Verificação de divergências obrigatória

- **Propriedade**: um capítulo pertence a uma única frente; Marcos 4 e 1 Pedro 2–5 permanecem preservados.
- **Arquivos históricos**: o auditor reconhece prefixos de arquivos já existentes em português e ordinais em inglês; não gerar cópias devido a diferenças de nomes.
- **Concorrência**: uma atualização no catálogo com SHA antigo é erro de concorrência, não autorização para força. Toda reexecução relê o PR e o catálogo.
- **Checagens**: versão do HEAD, cobertura `audit-bible-studies.py`, testes dos lotes, ESLint, TypeScript, build e workflows GitHub. Falhas não podem ser ignoradas.
- **Segurança e dados**: não escrever secrets, não usar geração paga/créditos Lovable, não modificar a `main` nem dados do aplicativo.
- **Revisão final**: auditoria técnica e revisão bíblica humana dos 1.189 capítulos antes do único merge manual.

Este documento define uma **matriz de responsabilidades**, não cria dez chats ou dez tarefas automaticamente.
