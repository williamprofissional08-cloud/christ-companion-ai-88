import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync("src/lib/content/luke-20-study.ts", "utf8");
const catalog = fs.readFileSync("src/lib/content/curated-studies.ts", "utf8");
const bible = JSON.parse(fs.readFileSync("src/lib/bible-livre/lucas.json", "utf8"));

test("Lucas 20: paráfrase explicativa individual de todos os 47 versículos", () => {
  const total = bible.chapters["20"].length;
  assert.equal(total, 47);
  const ids = [...source.matchAll(/"id": "versiculo-(\d+)"/g)].map(x => Number(x[1]));
  assert.deepEqual(ids, Array.from({length: total}, (_, i) => i + 1));
  assert.equal((source.match(/Paráfrase explicativa livre original \(não é citação bíblica\)/g) || []).length, total);
});

test("Lucas 20: seções e cuidados editoriais", () => {
  const ids = [...source.matchAll(/"id": "([^"]+)"/g)].map(x => x[1]);
  assert.equal(ids.length, 59);
  assert.equal(new Set(ids).size, 59);
  for (const term of ["antissemitismo", "ressurreição", "viúvas", "Oficina do pregador", "Interpretação e inferência"]) {
    assert.ok(source.toLowerCase().includes(term.toLowerCase()), term);
  }
});

test("Lucas 20: registro único no catálogo", () => {
  assert.equal((catalog.match(/import \{ luke20Study \} from "\.\/luke-20-study";/g) || []).length, 1);
  assert.equal((catalog.match(/"biblia-lucas-cap-20": luke20Study/g) || []).length, 1);
});
