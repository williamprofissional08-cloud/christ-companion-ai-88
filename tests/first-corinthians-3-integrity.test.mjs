import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const root = new URL("../", import.meta.url);
const study = readFileSync(new URL("src/lib/content/first-corinthians-3-study.ts", root), "utf8");
const catalog = readFileSync(new URL("src/lib/content/curated-studies.ts", root), "utf8");
const bible = JSON.parse(readFileSync(new URL("src/lib/bible-livre/1-corintios.json", root), "utf8"));
test("1 Coríntios 3 — paráfrase cobre os 23 versículos", () => {
  assert.equal(bible.chapters["3"].length, 23);
  const start = study.indexOf('"id": "leitura-integral"');
  const end = study.indexOf('"id": "introducao"', start);
  assert.ok(start >= 0 && end > start);
  const reading = study.slice(start, end);
  for (let n = 1; n <= 23; n++) assert.ok(reading.includes("**" + n + ".**"), "Versículo " + n);
});
test("1 Coríntios 3 — seções, exposição e registro únicos", () => {
  const ids = [...study.matchAll(/"id": "([^"]+)"/g)].map(m => m[1]);
  assert.equal(ids.length, 42);
  assert.equal(new Set(ids).size, ids.length);
  for (let n = 1; n <= 23; n++) assert.ok(ids.includes("versiculo-" + n));
  for (const id of ["leitura-integral","contexto","estrutura","questoes","referencias","aplicacoes","perguntas","exercicios","oficina","oracao"]) assert.ok(ids.includes(id), id);
  assert.equal(catalog.split('"biblia-1-corintios-cap-3":').length - 1, 1);
  assert.equal(catalog.split('import { firstCorinthians3Study }').length - 1, 1);
});
