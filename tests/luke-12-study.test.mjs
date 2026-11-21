import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync("src/lib/content/luke-12-study.ts", "utf8");
const catalog = fs.readFileSync("src/lib/content/curated-studies.ts", "utf8");
const bible = JSON.parse(fs.readFileSync("src/lib/bible-livre/lucas.json", "utf8"));

test("Lucas 12: todos os versículos têm seção e paráfrase identificada", () => {
  const count = bible.chapters["12"].length;
  assert.equal(count, 59);
  const refs = [...source.matchAll(/"id": "versiculo-(\d+)"/g)].map(x => Number(x[1]));
  assert.deepEqual(refs, Array.from({length: count}, (_, i) => i + 1));
  assert.equal((source.match(/Paráfrase explicativa livre original \(não é citação bíblica\)/g) || []).length, count);
});

test("Lucas 12: seções sem IDs duplicados e componentes editoriais", () => {
  const ids = [...source.matchAll(/"id": "([^"]+)"/g)].map(x => x[1]);
  assert.equal(ids.length, 74);
  assert.equal(ids.length, new Set(ids).size);
  for (const token of ["Oficina do pregador", "Perguntas com respostas", "Oração final", "Questões interpretativas", "Cuidados pastorais"]) {
    assert.ok(source.includes(token), token);
  }
});

test("Lucas 12: import e slug registrados uma única vez", () => {
  assert.equal((catalog.match(/import \{ luke12Study \} from "\.\/luke-12-study";/g) || []).length, 1);
  assert.equal((catalog.match(/"biblia-lucas-cap-12": luke12Study/g) || []).length, 1);
});
