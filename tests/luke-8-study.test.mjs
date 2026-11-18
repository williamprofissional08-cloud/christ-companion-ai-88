import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync("src/lib/content/luke-8-study.ts", "utf8");
const catalog = fs.readFileSync("src/lib/content/curated-studies.ts", "utf8");
const bible = JSON.parse(fs.readFileSync("src/lib/bible-livre/lucas.json", "utf8"));

test("Lucas 8: todos os 56 versículos com exposição individual", () => {
  const count = bible.chapters["8"].length;
  assert.equal(count, 56);
  const ids = [...source.matchAll(/"id": "versiculo-(\d+)"/g)].map(x => Number(x[1]));
  assert.deepEqual(ids, Array.from({length: count}, (_, i) => i + 1));
  assert.equal((source.match(/Paráfrase explicativa livre original \(não é citação bíblica\)/g) || []).length, count);
});

test("Lucas 8: IDs únicos, perícopes e salvaguardas", () => {
  const ids = [...source.matchAll(/"id": "([^"]+)"/g)].map(x => x[1]);
  assert.equal(ids.length, 73);
  assert.equal(ids.length, new Set(ids).size);
  for (const word of ["semeador", "Jairo", "Legião", "Oficina do pregador", "revisão humana"]) {
    assert.ok(source.toLowerCase().includes(word.toLowerCase()), word);
  }
});

test("Lucas 8: importação e slug únicos no catálogo", () => {
  assert.equal((catalog.match(/import \{ luke8Study \} from "\.\/luke-8-study";/g) || []).length, 1);
  assert.equal((catalog.match(/"biblia-lucas-cap-8": luke8Study/g) || []).length, 1);
});
