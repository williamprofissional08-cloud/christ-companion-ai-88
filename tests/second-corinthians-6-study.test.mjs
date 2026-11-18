import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const study = read("src/lib/content/second-corinthians-6-study.ts");
const catalog = read("src/lib/content/curated-studies.ts");
const bible = JSON.parse(read("src/lib/bible-livre/2-corintios.json"));
const verseCount = bible.chapters["6"].length;
test("2 Coríntios 6: acervo e leitura integral", () => {
  assert.equal(verseCount, 18);
  const reading = study.match(/"id": "leitura-integral"[\s\S]*?"body": "([^"]+)"/);
  assert.ok(reading);
  for (let n = 1; n <= verseCount; n++) {
    assert.ok(reading[1].includes("**"+n+".**"), "versículo "+n+" ausente");
    assert.match(study, new RegExp('"id": "exposicao-versiculo-'+n+'"'));
    assert.match(study, new RegExp('2 Coríntios 6:'+n+'(?:[^0-9]|$)'));
  }
  assert.match(study, /Paráfrase livre original para estudo/);
});
test("2 Coríntios 6: IDs únicos e blocos essenciais", () => {
  const ids = [...study.matchAll(/"id": "([^"]+)"/g)].map(m => m[1]);
  assert.equal(ids.length, new Set(ids).size);
  assert.ok(ids.length >= 30);
  for (const id of ["contexto-historico","interpretacao-inferencia","referencias-cruzadas","aplicacoes","perguntas-respostas","oficina-pregador","oracao-final"]) assert.ok(ids.includes(id), id);
});
test("2 Coríntios 6: catálogo sem duplicidade", () => {
  assert.equal(catalog.split('from "./second-corinthians-6-study"').length-1, 1);
  assert.equal(catalog.split('"biblia-2-corintios-cap-6":').length-1, 1);
});
