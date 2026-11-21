import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync("src/lib/content/luke-11-study.ts", "utf8");
const catalog = fs.readFileSync("src/lib/content/curated-studies.ts", "utf8");
const bible = JSON.parse(fs.readFileSync("src/lib/bible-livre/lucas.json", "utf8"));

test("Lucas 11: cobertura integral dos versículos e paráfrases", () => {
  const count = bible.chapters["11"].length;
  assert.equal(count, 54);
  const refs = [...source.matchAll(/"id": "versiculo-(\d+)"/g)].map(x => Number(x[1]));
  assert.deepEqual(refs, Array.from({length: count}, (_, i) => i + 1));
  assert.equal((source.match(/Paráfrase explicativa livre original \(não é citação bíblica\)/g) || []).length, count);
});

test("Lucas 11: IDs únicos, temas e ressalvas", () => {
  const ids = [...source.matchAll(/"id": "([^"]+)"/g)].map(x => x[1]);
  assert.equal(ids.length, new Set(ids).size);
  assert.equal(ids.length, 68);
  for (const token of ["Jonas", "Espírito Santo", "Oficina do pregador", "antissemitismo", "Zacarias", "revisão humana"]) {
    assert.ok(source.toLowerCase().includes(token.toLowerCase()), token);
  }
});

test("Lucas 11: import e slug únicos no catálogo", () => {
  assert.equal((catalog.match(/import \{ luke11Study \} from "\.\/luke-11-study";/g) || []).length, 1);
  assert.equal((catalog.match(/"biblia-lucas-cap-11": luke11Study/g) || []).length, 1);
});
