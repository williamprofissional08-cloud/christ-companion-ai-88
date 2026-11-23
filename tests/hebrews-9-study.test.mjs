import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const root = new URL("../", import.meta.url);
const study = readFileSync(new URL("src/lib/content/hebrews-9-study.ts", root), "utf8");
const catalog = readFileSync(new URL("src/lib/content/curated-studies.ts", root), "utf8");
const bible = JSON.parse(readFileSync(new URL("src/lib/bible-livre/hebreus.json", root), "utf8"));
test("Hebreus 9 cobre todos os 28 versículos", () => {
  assert.equal(bible.chapters["9"].length, 28);
  const start = study.indexOf('"id": "leitura"');
  const end = study.indexOf('"id": "introducao"', start);
  assert.ok(start >= 0 && end > start);
  const reading = study.slice(start, end);
  for (let i = 1; i <= 28; i++) assert.ok(reading.includes(`**${i}.`), `versículo ${i}`);
  assert.match(reading, /não é tradução bíblica oficial/);
});
test("Hebreus 9 tem exposição individual e IDs únicos", () => {
  const ids = [...study.matchAll(/"id": "([^"]+)"/g)].map(m => m[1]);
  assert.equal(ids.length, new Set(ids).size);
  for (let i = 1; i <= 28; i++) assert.ok(ids.includes(`versiculo-${i}`));
  for (const id of ["contexto","estrutura","interpretacao","referencias","aplicacao","exercicios","pregador","oracao"]) assert.ok(ids.includes(id));
});
test("Hebreus 9 integrado uma única vez", () => {
  assert.equal((catalog.match(/"biblia-hebreus-cap-9": hebrews9Study/g) ?? []).length, 1);
  assert.equal(catalog.split('import { hebrews9Study } from "./hebrews-9-study";').length - 1, 1);
});
