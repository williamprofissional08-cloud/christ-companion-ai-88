import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const root = new URL("../", import.meta.url);
const study = readFileSync(new URL("src/lib/content/hebrews-10-study.ts", root), "utf8");
const catalog = readFileSync(new URL("src/lib/content/curated-studies.ts", root), "utf8");
const bible = JSON.parse(readFileSync(new URL("src/lib/bible-livre/hebreus.json", root), "utf8"));
test("Hebreus 10 tem 39 versículos no acervo e na paráfrase", () => {
  assert.equal(bible.chapters["10"].length, 39);
  const start = study.indexOf('"id": "leitura"');
  const end = study.indexOf('"id": "introducao"', start);
  const reading = start >= 0 && end > start ? [study.slice(start, end)] : null;
  assert.ok(reading, "seção de leitura integral");
  for (let i = 1; i <= 39; i++) assert.ok(reading[0].includes(`**${i}.`), `versículo ${i}`);
});
test("Hebreus 10 possui seções expositivas sem IDs repetidos", () => {
  const ids = [...study.matchAll(/"id": "([^"]+)"/g)].map(m => m[1]);
  assert.equal(ids.length, new Set(ids).size);
  for (let i = 1; i <= 39; i++) assert.ok(ids.includes(`versiculo-${i}`));
  for (const id of ["contexto","estrutura","interpretacao","referencias","aplicacao","exercicios","pregador","oracao"]) assert.ok(ids.includes(id));
});
test("Hebreus 10 registrado uma única vez no catálogo", () => {
  assert.equal((catalog.match(/"biblia-hebreus-cap-10": hebrews10Study/g) ?? []).length, 1);
  assert.equal(catalog.split('import { hebrews10Study } from "./hebrews-10-study";').length - 1, 1);
});
