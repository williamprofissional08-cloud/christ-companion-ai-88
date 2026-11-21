import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const root = new URL("../", import.meta.url);
const study = readFileSync(new URL("src/lib/content/first-corinthians-2-study.ts", root), "utf8");
const catalog = readFileSync(new URL("src/lib/content/curated-studies.ts", root), "utf8");
const bible = JSON.parse(readFileSync(new URL("src/lib/bible-livre/1-corintios.json", root), "utf8"));
test("1 Coríntios 2 — leitura integral original", () => {
  assert.equal(bible.chapters["2"].length, 16);
  const reading = study.slice(study.indexOf('"id": "leitura-integral"'), study.indexOf('"id": "introducao"'));
  for (let n=1;n<=16;n++) assert.ok(reading.includes("**"+n+".**"), "Versículo "+n);
  assert.match(reading, /paráfrase livre original/i);
});
test("1 Coríntios 2 — estrutura, IDs e catálogo", () => {
  const ids=[...study.matchAll(/"id": "([^"]+)"/g)].map(m=>m[1]);
  assert.equal(ids.length, 34);
  assert.equal(new Set(ids).size, ids.length);
  for(let n=1;n<=16;n++) assert.ok(ids.includes("versiculo-"+n));
  for(const id of ["leitura-integral","contexto","estrutura","questoes","referencias","aplicacoes","perguntas","exercicios","oficina","oracao"]) assert.ok(ids.includes(id),id);
  assert.equal(catalog.split('"biblia-1-corintios-cap-2":').length-1,1);
  assert.equal(catalog.split('import { firstCorinthians2Study }').length-1,1);
});
