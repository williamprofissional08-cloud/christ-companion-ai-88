import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8");
const study = read("src/lib/content/galatians-4-study.ts");
const catalog = read("src/lib/content/curated-studies.ts");
const verses = JSON.parse(read("src/lib/bible-livre/galatas.json")).chapters["4"];

test("Gálatas 4: leitura completa e exposição de todos os versículos", () => {
  assert.equal(verses.length, 31);
  for (let n = 1; n <= verses.length; n++) {
    assert.ok(study.includes('"id": "exposicao-versiculo-' + n + '"'), "Exposição ausente: " + n);
    assert.ok(study.includes('"Gálatas 4:' + n + '"'), "Referência ausente: " + n);
    assert.ok(study.includes("**" + n + ".**"), "Leitura bíblica ausente: " + n);
  }
});

test("Gálatas 4: único registro e import no catálogo", () => {
  assert.equal(catalog.match(/"biblia-galatas-cap-4"\s*:/g)?.length, 1);
  assert.match(catalog, /import \{ galatians4Study \} from "\.\/galatians-4-study";/);
});

test("Gálatas 4: elementos obrigatórios de estudo profundo", () => {
  for (const field of ["historicalContext", "keyPoints", "crossReferences", "questions", "prayer", "sections"]) {
    assert.ok(study.includes('"' + field + '"'), "Campo ausente: " + field);
  }
  for (const section of ["leitura-integral-galatas-4", "introducao-contexto", "estrutura-genero", "termos-originais", "questoes-debatidas", "referencias-cruzadas", "cristo-historia-redencao", "perguntas-respostas", "oficina-pregador", "aplicacao-oracao"]) {
    assert.ok(study.includes(section), "Seção ausente: " + section);
  }
  assert.match(study, /revisão bíblica humana pendente/);
});
