import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync("src/lib/content/luke-9-study.ts", "utf8");
const catalog = fs.readFileSync("src/lib/content/curated-studies.ts", "utf8");
const bible = JSON.parse(fs.readFileSync("src/lib/bible-livre/lucas.json", "utf8"));

test("Lucas 9: todos os versículos recebem paráfrase e exposição", () => {
  const count = bible.chapters["9"].length;
  assert.equal(count, 62);
  const ids = [...source.matchAll(/"id": "versiculo-(\d+)"/g)].map(x => Number(x[1]));
  assert.deepEqual(ids, Array.from({length: count}, (_, i) => i + 1));
  assert.equal((source.match(/Paráfrase explicativa livre original \(não é citação bíblica\)/g) || []).length, count);
});
test("Lucas 9: IDs únicos e seções editoriais", () => {
  const ids = [...source.matchAll(/"id": "([^"]+)"/g)].map(x => x[1]);
  assert.equal(ids.length, new Set(ids).size);
  assert.equal(ids.length, 75);
  for (const term of ["transfiguração", "Jerusalém", "Oficina do pregador", "Variantes textuais", "Cuidado com passagens sensíveis"]) assert.ok(source.includes(term), term);
});
test("Lucas 9: importação e slug únicos", () => {
  assert.equal((catalog.match(/import \{ luke9Study \} from "\.\/luke-9-study";/g) || []).length, 1);
  assert.equal((catalog.match(/"biblia-lucas-cap-9": luke9Study/g) || []).length, 1);
});
