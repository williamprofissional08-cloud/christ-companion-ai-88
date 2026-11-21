import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync("src/lib/content/luke-14-study.ts", "utf8");
const catalog = fs.readFileSync("src/lib/content/curated-studies.ts", "utf8");
const bible = JSON.parse(fs.readFileSync("src/lib/bible-livre/lucas.json", "utf8"));

test("Lucas 14: cobertura exata e paráfrase sinalizada", () => {
  const count = bible.chapters["14"].length;
  assert.equal(count, 35);
  const refs = [...source.matchAll(/"id": "versiculo-(\d+)"/g)].map(x => Number(x[1]));
  assert.deepEqual(refs, Array.from({ length: count }, (_, i) => i + 1));
  assert.equal((source.match(/Paráfrase explicativa livre original \(não é citação bíblica\)/g) || []).length, count);
});
test("Lucas 14: IDs únicos, temas sensíveis e estrutura editorial", () => {
  const ids = [...source.matchAll(/"id": "([^"]+)"/g)].map(x => x[1]);
  assert.equal(ids.length, 44);
  assert.equal(ids.length, new Set(ids).size);
  for (const token of ["Oficina do pregador", "Perguntas com respostas", "Oração final", "Questões interpretativas", "coerção religiosa", "hipérbole"]) assert.ok(source.includes(token), token);
});
test("Lucas 14: registro único", () => {
  assert.equal((catalog.match(/import \{ luke14Study \} from "\.\/luke-14-study";/g) || []).length, 1);
  assert.equal((catalog.match(/"biblia-lucas-cap-14": luke14Study/g) || []).length, 1);
});
