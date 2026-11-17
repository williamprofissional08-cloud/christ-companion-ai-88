import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync("src/lib/content/luke-1-study.ts", "utf8");
const catalog = fs.readFileSync("src/lib/content/curated-studies.ts", "utf8");
const bible = JSON.parse(fs.readFileSync("src/lib/bible-livre/lucas.json", "utf8"));

test("Lucas 1: oitenta versículos com paráfrase original e exposição individual", () => {
  const count = bible.chapters["1"].length;
  assert.equal(count, 80);
  const refs = [...source.matchAll(/"title": "Lucas 1:(\\d+) — leitura e exposição"/g)].map(x => Number(x[1]));
  assert.deepEqual(refs, Array.from({length: count}, (_, i) => i + 1));
  assert.equal((source.match(/Paráfrase explicativa livre original \\(não é citação bíblica\\)/g) || []).length, count);
});

test("Lucas 1: seções com IDs únicos, perícopes e salvaguardas", () => {
  const ids = [...source.matchAll(/"id": "([^"]+)"/g)].map(x => x[1]);
  assert.equal(ids.length, new Set(ids).size);
  assert.ok(ids.length >= 95);
  for (const token of ["Magnificat", "Benedictus", "Oficina do pregador", "infertilidade", "interpretação", "revisão humana"]) {
    assert.ok(source.includes(token), token);
  }
});

test("Lucas 1: catálogo registra importação e slug uma única vez", () => {
  assert.equal((catalog.match(/import \\{ luke1Study \\} from "\\.\\/luke-1-study";/g) || []).length, 1);
  assert.equal((catalog.match(/"biblia-lucas-cap-1": luke1Study/g) || []).length, 1);
});
