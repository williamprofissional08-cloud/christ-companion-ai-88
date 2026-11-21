import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const study = fs.readFileSync("src/lib/content/luke-21-study.ts", "utf8");
const catalog = fs.readFileSync("src/lib/content/curated-studies.ts", "utf8");
const verses = JSON.parse(fs.readFileSync("src/lib/bible-livre/lucas.json", "utf8")).chapters["21"];

test("Lucas 21: todos os 38 versículos em ordem e paráfrases identificadas", () => {
  assert.equal(verses.length, 38);
  const ids = [...study.matchAll(/"id": "versiculo-(\d+)"/g)].map(m => Number(m[1]));
  assert.deepEqual(ids, Array.from({length: 38}, (_, i) => i + 1));
  assert.equal((study.match(/Paráfrase explicativa livre original \(não é citação bíblica\)/g) || []).length, 38);
});

test("Lucas 21: seções únicas e cobertura didática", () => {
  const ids = [...study.matchAll(/"id": "([^"]+)"/g)].map(m => m[1]);
  assert.equal(ids.length, 53);
  assert.equal(new Set(ids).size, ids.length);
  for (const marker of ["viúva", "Jerusalém", "Filho do Homem", "Oficina do pregador", "Oração final", "Interpretação"]) {
    assert.ok(study.toLowerCase().includes(marker.toLowerCase()), marker);
  }
});

test("Lucas 21: catálogo com um único registro", () => {
  assert.equal((catalog.match(/import \{ luke21Study \} from "\.\/luke-21-study";/g) || []).length, 1);
  assert.equal((catalog.match(/"biblia-lucas-cap-21": luke21Study/g) || []).length, 1);
});
