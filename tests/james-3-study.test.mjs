import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const study = readFileSync(new URL("../src/lib/content/james-3-study.ts", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");
const bible = JSON.parse(readFileSync(new URL("../src/lib/bible-livre/tiago.json", import.meta.url), "utf8"));
test("Tiago 3: cobertura integral", () => {
  const verses = bible.chapters["3"];
  assert.equal(verses.length, 18);
  const reading = study.slice(study.indexOf('"id": "leitura"'), study.indexOf('"id": "contexto"'));
  for (let i = 1; i <= verses.length; i++) {
    assert.ok(reading.includes(String.raw`\n\n` + i + ". "), "leitura ausente: " + i);
    assert.ok(study.includes('"id": "versiculo-' + i + '"'), "exposição ausente: " + i);
  }
});
test("Tiago 3: catálogo único", () => {
  assert.equal(catalog.split('import { james3Study } from "./james-3-study";').length - 1, 1);
  assert.equal(catalog.split('"biblia-tiago-cap-3": james3Study').length - 1, 1);
});
test("Tiago 3: seções únicas", () => {
  const ids = [...study.matchAll(/"id": "([^"]+)"/g)].map(x => x[1]);
  assert.equal(ids.length, new Set(ids).size);
  for (const id of ["contexto", "pericopes", "termos", "referencias", "cuidados", "aplicacao", "exercicios", "pregador", "oracao"]) assert.ok(ids.includes(id));
});
