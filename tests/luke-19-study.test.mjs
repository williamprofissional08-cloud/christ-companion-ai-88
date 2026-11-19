import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync("src/lib/content/luke-19-study.ts", "utf8");
const catalog = fs.readFileSync("src/lib/content/curated-studies.ts", "utf8");
const bible = JSON.parse(fs.readFileSync("src/lib/bible-livre/lucas.json", "utf8"));

test("Lucas 19: paráfrases e notas para todos os 48 versículos", () => {
  const count = bible.chapters["19"].length;
  assert.equal(count, 48);
  const verses = [...source.matchAll(/"id": "versiculo-(\d+)"/g)].map(x => Number(x[1]));
  assert.deepEqual(verses, Array.from({length: count}, (_, i) => i + 1));
  assert.equal((source.match(/Paráfrase explicativa livre original \(não é citação bíblica\)/g) || []).length, count);
});

test("Lucas 19: seções únicas e temas essenciais", () => {
  const ids = [...source.matchAll(/"id": "([^"]+)"/g)].map(x => x[1]);
  assert.equal(ids.length, 60);
  assert.equal(new Set(ids).size, 60);
  for (const term of ["Zaqueu", "minas", "Jerusalém", "Oficina do pregador", "interpretação", "violência"]) {
    assert.ok(source.toLowerCase().includes(term.toLowerCase()), term);
  }
});

test("Lucas 19: um import e um slug no catálogo", () => {
  assert.equal((catalog.match(/import \{ luke19Study \} from "\.\/luke-19-study";/g) || []).length, 1);
  assert.equal((catalog.match(/"biblia-lucas-cap-19": luke19Study/g) || []).length, 1);
});
