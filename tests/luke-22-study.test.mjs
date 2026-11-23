import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const study = fs.readFileSync("src/lib/content/luke-22-study.ts", "utf8");
const bible = JSON.parse(fs.readFileSync("src/lib/bible-livre/lucas.json", "utf8"));
const catalog = fs.readFileSync("src/lib/content/curated-studies.ts", "utf8");
test("Lucas 22 cobre cada versículo do BLIVRE em ordem", () => {
  assert.equal(bible.chapters["22"].length, 71);
  const verses = [...study.matchAll(/"id": "versiculo-(\d+)"/g)].map(m => +m[1]);
  assert.deepEqual(verses, Array.from({length: 71}, (_, i) => i + 1));
  assert.equal((study.match(/Paráfrase explicativa livre original \(não é citação bíblica\)/g) || []).length, 71);
});
test("Lucas 22 tem IDs únicos e notas sensíveis", () => {
  const ids = [...study.matchAll(/"id": "([^"]+)"/g)].map(m => m[1]);
  assert.equal(ids.length, 87);
  assert.equal(new Set(ids).size, 87);
  for (const word of ["variante", "espada", "Oficina do pregador", "oração", "aliança"]) assert.ok(study.toLowerCase().includes(word.toLowerCase()), word);
});
test("Lucas 22 é importado e registrado uma vez", () => {
  assert.equal((catalog.match(/import \{ luke22Study \} from "\.\/luke-22-study";/g) || []).length, 1);
  assert.equal((catalog.match(/"biblia-lucas-cap-22": luke22Study/g) || []).length, 1);
});
