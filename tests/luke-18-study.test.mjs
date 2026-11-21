import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync("src/lib/content/luke-18-study.ts", "utf8");
const catalog = fs.readFileSync("src/lib/content/curated-studies.ts", "utf8");
const bible = JSON.parse(fs.readFileSync("src/lib/bible-livre/lucas.json", "utf8"));

test("Lucas 18: 43 versículos com paráfrase original individual", () => {
  const total = bible.chapters["18"].length;
  assert.equal(total, 43);
  const ids = [...source.matchAll(/"id": "versiculo-(\d+)"/g)].map(x => Number(x[1]));
  assert.deepEqual(ids, Array.from({length: total}, (_, i) => i + 1));
  assert.equal((source.match(/Paráfrase explicativa livre original \(não é citação bíblica\)/g) || []).length, total);
});

test("Lucas 18: seções únicas e conteúdo pastoral", () => {
  const ids = [...source.matchAll(/"id": "([^"]+)"/g)].map(x => x[1]);
  assert.equal(ids.length, 56);
  assert.equal(new Set(ids).size, 56);
  for (const term of ["viúva", "fariseu", "crianças", "rico", "Jericó", "Oficina de pregação"]) {
    assert.ok(source.toLowerCase().includes(term.toLowerCase()), term);
  }
});

test("Lucas 18: import e slug únicos", () => {
  assert.equal((catalog.match(/import \{ luke18Study \} from "\.\/luke-18-study";/g) || []).length, 1);
  assert.equal((catalog.match(/"biblia-lucas-cap-18": luke18Study/g) || []).length, 1);
});
