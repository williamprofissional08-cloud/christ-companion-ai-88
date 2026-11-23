import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const root = new URL("../", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8");
const content = read("src/lib/content/galatians-3-study.ts");
const catalog = read("src/lib/content/curated-studies.ts");
const bible = JSON.parse(read("src/lib/bible-livre/galatas.json"));
test("Gálatas 3: todos os 29 versículos BLIVRE cobertos, sem lacuna", () => {
  const verses = bible.chapters["3"];
  assert.equal(verses.length, 29);
  for (let i = 1; i <= verses.length; i++) {
    assert.match(content, new RegExp("Gálatas 3:" + i + '(?![0-9])'));
    assert.match(content, new RegExp("exposicao-versiculo-" + i + '"'));
  }
});
test("Gálatas 3 registrado uma única vez no catálogo", () => {
  assert.equal(catalog.match(/"biblia-galatas-cap-3"\s*:/g)?.length, 1);
  assert.match(catalog, /import \{ galatians3Study \} from "\.\/galatians-3-study";/);
});
test("Gálatas 3: exposição, história, referências e oficina", () => {
  for (const field of ["historicalContext", "keyPoints", "crossReferences", "questions", "prayer", "sections"]) assert.match(content, new RegExp('"'+field+'"'));
  for (const section of ["leitura-integral-galatas-3", "contexto-e-objetivos", "linguagem-e-interpretacao", "referencias-cruzadas", "cristo-e-redencao", "perguntas-e-respostas", "oficina-do-pregador", "aplicacoes-e-oracao"]) assert.ok(content.includes(section),section);
  assert.match(content, /revisar por especialista humano/);
});
