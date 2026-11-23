import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const study = readFileSync(new URL("../src/lib/content/matthew-23-study.ts", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");
const bible = JSON.parse(readFileSync(new URL("../src/lib/bible-livre/mateus.json", import.meta.url), "utf8"));

test("Mateus 23 expõe cada versículo uma vez e na ordem", () => {
  const verses = bible.chapters["23"];
  assert.equal(verses.length, 39);
  const ids = [...study.matchAll(/"id": "versiculo-(\d+)"/g)].map((match) => Number(match[1]));
  assert.deepEqual(ids, Array.from({ length: verses.length }, (_, i) => i + 1));
  for (let verse = 1; verse <= verses.length; verse++) assert.ok(study.includes(`"Mateus 23:${verse}"`));
});

test("Mateus 23 tem componentes editoriais e slug integrado uma vez", () => {
  for (const id of ["leitura", "contexto", "estrutura", "lexico", "debates", "referencias", "cristo", "distincoes", "aplicacao", "exercicios", "pregador", "oracao"]) {
    assert.ok(study.includes(`"id": "${id}"`), `seção ausente: ${id}`);
  }
  assert.match(study, /23:14/);
  assert.match(study, /antissemitismo/);
  assert.equal((catalog.match(/"biblia-mateus-cap-23": matthew23Study/g) ?? []).length, 1);
  assert.equal((catalog.match(/import \{ matthew23Study \} from "\.\/matthew-23-study";/g) ?? []).length, 1);
});
