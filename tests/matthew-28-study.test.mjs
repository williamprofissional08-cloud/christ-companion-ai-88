import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/lib/content/matthew-28-study.ts", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");
const bible = JSON.parse(readFileSync(new URL("../src/lib/bible-livre/mateus.json", import.meta.url), "utf8"));
const match = source.match(/export const matthew28Study: StudyContent = (\{[\s\S]*\});/);
assert.ok(match, "estudo exportado");
const study = JSON.parse(match[1]);

test("Mateus 28: acervo e leitura exegética de cada versículo", () => {
  const verses = bible.chapters["28"];
  assert.equal(verses.length, 20);
  assert.equal(study.depth, "deep");
  const notes = study.sections.filter((section) => /^versiculo-\d+$/.test(section.id));
  assert.equal(notes.length, verses.length);
  for (let i = 0; i < verses.length; i++) {
    assert.ok(verses[i].trim());
    assert.equal(notes[i].id, `versiculo-${i + 1}`);
    assert.deepEqual(notes[i].scriptureRefs, [`Mateus 28:${i + 1}`]);
    assert.ok(notes[i].body.includes("Paráfrase explicativa livre"));
    assert.ok(notes[i].body.length > 100);
  }
});

test("Mateus 28: catálogo único e estrutura editorial", () => {
  assert.equal(catalog.split('import { matthew28Study } from "./matthew-28-study";').length - 1, 1);
  assert.equal(catalog.split('"biblia-mateus-cap-28": matthew28Study,').length - 1, 1);
  const ids = study.sections.map((section) => section.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ["leitura", "introducao", "contexto", "estrutura", "exposicao-1", "exposicao-2", "exposicao-3", "questoes-interpretativas", "referencias", "cristo", "aplicacao", "exercicios", "oficina", "oracao"]) {
    assert.ok(ids.includes(id), `seção obrigatória: ${id}`);
  }
  for (const key of ["intro", "historicalContext", "application", "conclusion", "prayer"]) {
    assert.ok(study[key].length > 30);
  }
});
