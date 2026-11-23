import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync("src/lib/content/luke-23-study.ts", "utf8");
const catalog = fs.readFileSync("src/lib/content/curated-studies.ts", "utf8");
const bible = JSON.parse(fs.readFileSync("src/lib/bible-livre/lucas.json", "utf8"));

test("Lucas 23: todos os 56 versículos em ordem", () => {
  assert.equal(bible.chapters["23"].length, 56);
  const verseIds = [...source.matchAll(/"id": "versiculo-(\d+)"/g)].map(m => Number(m[1]));
  assert.deepEqual(verseIds, Array.from({length: 56}, (_, i) => i + 1));
  assert.equal((source.match(/Paráfrase explicativa livre original \(não é citação bíblica\)/g) || []).length, 56);
});

test("Lucas 23: 69 seções únicas e cuidados editoriais", () => {
  const ids = [...source.matchAll(/"id": "([^"]+)"/g)].map(m => m[1]);
  assert.equal(ids.length, 69);
  assert.equal(new Set(ids).size, 69);
  for (const term of ["variante", "antissemitismo", "Oficina do pregador", "José", "mulheres"]) {
    assert.ok(source.toLowerCase().includes(term.toLowerCase()), term);
  }
});

test("Lucas 23: import e slug únicos", () => {
  assert.equal((catalog.match(/import \{ luke23Study \} from "\.\/luke-23-study";/g) || []).length, 1);
  assert.equal((catalog.match(/"biblia-lucas-cap-23": luke23Study/g) || []).length, 1);
});
