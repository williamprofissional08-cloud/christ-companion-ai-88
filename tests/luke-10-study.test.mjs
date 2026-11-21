import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync("src/lib/content/luke-10-study.ts", "utf8");
const catalog = fs.readFileSync("src/lib/content/curated-studies.ts", "utf8");
const bible = JSON.parse(fs.readFileSync("src/lib/bible-livre/lucas.json", "utf8"));

test("Lucas 10: 42 versículos cobertos em sequência", () => {
  const count = bible.chapters["10"].length;
  assert.equal(count, 42);
  const refs = [...source.matchAll(/"id": "versiculo-(\d+)"/g)].map(x => Number(x[1]));
  assert.deepEqual(refs, Array.from({length: count}, (_, i) => i + 1));
  assert.equal((source.match(/Paráfrase explicativa livre original \(não é citação bíblica\)/g) || []).length, count);
});
test("Lucas 10: IDs únicos e conteúdo editorial mínimo", () => {
  const ids = [...source.matchAll(/"id": "([^"]+)"/g)].map(x => x[1]);
  assert.equal(ids.length, 55);
  assert.equal(new Set(ids).size, ids.length);
  for (const word of ["samaritano", "Marta", "Maria", "Oficina do pregador", "Variantes textuais", "Oração", "revisão editorial humana"]) {
    assert.ok(source.includes(word), word);
  }
});
test("Lucas 10: import e slug registrados uma vez", () => {
  assert.equal((catalog.match(/import \{ luke10Study \} from "\.\/luke-10-study";/g) || []).length, 1);
  assert.equal((catalog.match(/"biblia-lucas-cap-10": luke10Study/g) || []).length, 1);
});
