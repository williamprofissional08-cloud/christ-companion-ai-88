import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync("src/lib/content/luke-3-study.ts", "utf8");
const catalog = fs.readFileSync("src/lib/content/curated-studies.ts", "utf8");
const bible = JSON.parse(fs.readFileSync("src/lib/bible-livre/lucas.json", "utf8"));

test("Lucas 3: exposição individual de todos os versículos", () => {
  const total = bible.chapters["3"].length;
  assert.equal(total, 38);
  const refs = [...source.matchAll(/"id": "versiculo-(\d+)"/g)].map(x => Number(x[1]));
  assert.deepEqual(refs, Array.from({length: total}, (_, i) => i + 1));
  assert.equal((source.match(/Paráfrase explicativa livre original \(não é citação bíblica\)/g) || []).length, total);
});

test("Lucas 3: IDs únicos e salvaguardas editoriais", () => {
  const ids = [...source.matchAll(/"id": "([^"]+)"/g)].map(x => x[1]);
  assert.equal(ids.length, new Set(ids).size);
  assert.equal(ids.length, 54);
  for (const token of ["genealogia", "Oficina do pregador", "revisão", "arrependimento", "interpretação"]) {
    assert.ok(source.toLowerCase().includes(token.toLowerCase()), token);
  }
});

test("Lucas 3: import e slug únicos", () => {
  assert.equal((catalog.match(/import \{ luke3Study \} from "\.\/luke-3-study";/g) || []).length, 1);
  assert.equal((catalog.match(/"biblia-lucas-cap-3": luke3Study/g) || []).length, 1);
});
