import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const study = fs.readFileSync("src/lib/content/john-1-study.ts", "utf8");
const catalog = fs.readFileSync("src/lib/content/curated-studies.ts", "utf8");
const bible = JSON.parse(fs.readFileSync("src/lib/bible-livre/joao.json", "utf8"));

test("João 1: cobertura integral dos 51 versículos", () => {
  const count = bible.chapters["1"].length;
  assert.equal(count, 51);
  const numbers = [...study.matchAll(/"id": "versiculo-(\d+)"/g)].map(m => Number(m[1]));
  assert.deepEqual(numbers, Array.from({ length: count }, (_, i) => i + 1));
  assert.equal((study.match(/Paráfrase explicativa livre original \(não é citação bíblica\)/g) || []).length, count);
});

test("João 1: IDs únicos, temas e sinalização editorial", () => {
  const ids = [...study.matchAll(/"id": "([^"]+)"/g)].map(m => m[1]);
  assert.equal(ids.length, 67);
  assert.equal(new Set(ids).size, ids.length);
  for (const term of ["Oficina do pregador", "Interpretação", "Oração final", "variantes", "antissemitismo", "Referências cruzadas"]) {
    assert.ok(study.toLowerCase().includes(term.toLowerCase()), term);
  }
});

test("João 1: import e slug registrados exatamente uma vez", () => {
  assert.equal((catalog.match(/import \{ john1Study \} from "\.\/john-1-study";/g) || []).length, 1);
  assert.equal((catalog.match(/"biblia-joao-cap-1": john1Study/g) || []).length, 1);
});
