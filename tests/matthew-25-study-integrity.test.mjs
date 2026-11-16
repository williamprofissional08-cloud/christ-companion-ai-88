import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const root = new URL("../", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8");
const study = read("src/lib/content/matthew-25-study.ts");
const catalog = read("src/lib/content/curated-studies.ts");
const bible = JSON.parse(read("src/lib/bible-livre/mateus.json"));
test("Mateus 25: contagem exata de versículos do acervo", () => {
  const verses = bible.chapters["25"];
  assert.equal(verses.length, 46);
  const refs = [...study.matchAll(/"id": "versiculo-(\\d+)"/g)].map(x => Number(x[1]));
  assert.deepEqual(refs, Array.from({length: verses.length}, (_, i) => i+1));
  for(let i=1;i<=verses.length;i++) assert.match(study, new RegExp('Mateus 25:'+i+'\\\\b'));
});
test("Mateus 25: catálogo sem slug ou import duplicados", () => {
  assert.equal(catalog.split('"biblia-mateus-cap-25": matthew25Study').length - 1, 1);
  assert.equal(catalog.split('import { matthew25Study } from "./matthew-25-study";').length - 1, 1);
});
test("Mateus 25: estrutura editorial e cautelas", () => {
  assert.match(study, /paráfrases explicativas livres/i);
  for (const term of ["exegesis", "interpretation", "references", "application", "exercise", "preaching", "prayer", "meus irmãos", "talento", "vigilância"]) assert.ok(study.toLowerCase().includes(term.toLowerCase()), term);
  assert.equal([...study.matchAll(/"kind": "exegesis"/g)].length >= 46, true);
});
