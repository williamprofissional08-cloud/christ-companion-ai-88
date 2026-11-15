import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const study = readFileSync(new URL("../src/lib/content/malaquias-4-study.ts", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");
const bible = JSON.parse(readFileSync(new URL("../src/lib/bible-livre/malaquias.json", import.meta.url), "utf8"));

test("Malaquias 4: cobre todos os versículos do acervo BLIVRE", () => {
  const verses = bible.chapters["4"];
  assert.equal(verses.length, 6);
  for (let n = 1; n <= verses.length; n++) {
    assert.match(study, new RegExp('"id": "versiculo-' + n + '"'));
    assert.match(study, new RegExp('"Malaquias 4:' + n + '"'));
  }
  assert.equal((study.match(/"id": "versiculo-[0-9]+"/g) ?? []).length, verses.length);
});

test("Malaquias 4: integrado uma única vez ao catálogo", () => {
  assert.ok(catalog.includes('import { malaquias4Study } from "./malaquias-4-study";'));
  assert.equal((catalog.match(/"biblia-malaquias-cap-4": malaquias4Study/g) ?? []).length, 1);
});

test("Malaquias 4: possui seções editoriais essenciais", () => {
  for (const id of ["contexto", "estrutura", "termos", "debates", "referencias", "cristo", "distincoes", "exercicios", "pregador", "oracao"]) {
    assert.ok(study.includes('"id": "' + id + '"'), "Falta seção: " + id);
  }
});
