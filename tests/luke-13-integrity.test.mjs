import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const source = readFileSync(new URL("src/lib/content/luke-13-study.ts", root), "utf8");
const bible = JSON.parse(readFileSync(new URL("src/lib/bible-livre/lucas.json", root), "utf8"));
const catalog = readFileSync(new URL("src/lib/content/curated-studies.ts", root), "utf8");
const verses = bible.chapters["13"];

test("Lucas 13 cobre exatamente os 35 versículos BLIVRE", () => {
  assert.equal(verses.length, 35);
  const titles = [...source.matchAll(/"title": "Lucas 13:(\\d+) —/g)].map(m => Number(m[1]));
  assert.deepEqual(titles, Array.from({length: verses.length}, (_, i) => i + 1));
  const refs = [...source.matchAll(/"id": "versiculo-(\\d+)"/g)].map(m => Number(m[1]));
  assert.deepEqual(refs, titles);
});

test("Lucas 13 tem IDs únicos, paráfrases sinalizadas e exposição contextual", () => {
  const ids = [...source.matchAll(/"id": "([^"]+)"/g)].map(m => m[1]);
  assert.equal(ids.length, new Set(ids).size);
  assert.equal((source.match(/Paráfrase explicativa livre original/g) || []).length, 35);
  assert.equal((source.match(/Exposição contextual e limites:/g) || []).length, 35);
  for (const id of ["estrutura","historico","referencias","debates","perguntas","pregador","oracao"]) assert.ok(ids.includes(id));
});

test("Lucas 13 registrado uma única vez no catálogo", () => {
  assert.equal((catalog.match(/"biblia-lucas-cap-13":/g) || []).length, 1);
  assert.equal((catalog.match(/import \\{ luke13Study \\} from "\\.\\/luke-13-study";/g) || []).length, 1);
});
