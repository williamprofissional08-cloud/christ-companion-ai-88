import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync("src/lib/content/luke-17-study.ts", "utf8");
const catalog = fs.readFileSync("src/lib/content/curated-studies.ts", "utf8");
const bible = JSON.parse(fs.readFileSync("src/lib/bible-livre/lucas.json", "utf8"));

test("Lucas 17: 37 versículos com paráfrase explicativa individual", () => {
  const total = bible.chapters["17"].length;
  assert.equal(total, 37);
  const ids = [...source.matchAll(/"id": "versiculo-(\d+)"/g)].map(x => Number(x[1]));
  assert.deepEqual(ids, Array.from({length: total}, (_, i) => i + 1));
  assert.equal((source.match(/Paráfrase explicativa livre original \(não é citação bíblica\)/g) || []).length, total);
});

test("Lucas 17: seções únicas e variantes tratadas", () => {
  const ids = [...source.matchAll(/"id": "([^"]+)"/g)].map(x => x[1]);
  assert.equal(ids.length, 50);
  assert.equal(new Set(ids).size, 50);
  for (const term of ["variante", "samaritano", "Oficina do pregador", "perdão", "interpretação"]) {
    assert.ok(source.toLowerCase().includes(term.toLowerCase()), term);
  }
});

test("Lucas 17: registro único", () => {
  assert.equal((catalog.match(/import \{ luke17Study \} from "\.\/luke-17-study";/g) || []).length, 1);
  assert.equal((catalog.match(/"biblia-lucas-cap-17": luke17Study/g) || []).length, 1);
});
