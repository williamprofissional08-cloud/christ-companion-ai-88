import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync("src/lib/content/luke-6-study.ts", "utf8");
const catalog = fs.readFileSync("src/lib/content/curated-studies.ts", "utf8");
const bible = JSON.parse(fs.readFileSync("src/lib/bible-livre/lucas.json", "utf8"));

test("Lucas 6: cobertura integral dos versículos e paráfrases livres", () => {
  const count = bible.chapters["6"].length;
  assert.equal(count, 49);
  const verses = [...source.matchAll(/"id": "versiculo-(\d+)"/g)].map(x => Number(x[1]));
  assert.deepEqual(verses, Array.from({length: count}, (_, i) => i + 1));
  assert.equal((source.match(/Paráfrase explicativa livre original \(não é citação bíblica\)/g) || []).length, count);
});

test("Lucas 6: IDs únicos, seções editoriais e salvaguardas", () => {
  const ids = [...source.matchAll(/"id": "([^"]+)"/g)].map(x => x[1]);
  assert.equal(ids.length, new Set(ids).size);
  assert.equal(ids.length, 64);
  for (const token of ["Oficina do pregador", "misericórdia", "violência", "interpretação", "revisão humana"]) {
    assert.ok(source.toLowerCase().includes(token.toLowerCase()), token);
  }
});

test("Lucas 6: registro único no catálogo", () => {
  assert.equal((catalog.match(/import \{ luke6Study \} from "\.\/luke-6-study";/g) || []).length, 1);
  assert.equal((catalog.match(/"biblia-lucas-cap-6": luke6Study/g) || []).length, 1);
});
