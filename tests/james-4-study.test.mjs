import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const study = readFileSync(new URL("../src/lib/content/james-4-study.ts", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");
const bible = JSON.parse(readFileSync(new URL("../src/lib/bible-livre/tiago.json", import.meta.url), "utf8"));

test("Tiago 4: leitura integral e exposições cobrem todos os versículos", () => {
  const verses = bible.chapters["4"];
  assert.equal(verses.length, 17);
  const reading = study.match(/"id": "leitura"[\s\S]*?"id": "contexto"/)?.[0];
  assert.ok(reading, "leitura integral ausente");
  for (let verse = 1; verse <= verses.length; verse++) {
    assert.match(reading, new RegExp(`\\\\n\\\\n${verse}\\\\. `), `paráfrase do versículo ${verse}`);
    assert.match(study, new RegExp(`"id": "versiculo-${verse}"`), `exposição do versículo ${verse}`);
  }
});
test("Tiago 4: catálogo tem import e slug únicos", () => {
  assert.equal((catalog.match(/import \{ james4Study \} from "\.\/james-4-study";/g) ?? []).length, 1);
  assert.equal((catalog.match(/"biblia-tiago-cap-4": james4Study/g) ?? []).length, 1);
});
test("Tiago 4: estrutura pastoral e identificadores sem duplicação", () => {
  const ids = [...study.matchAll(/"id": "([^"]+)"/g)].map((m) => m[1]);
  assert.equal(ids.length, new Set(ids).size);
  for (const id of ["contexto", "pericopes", "termos", "referencias", "cuidados", "aplicacao", "exercicios", "pregador", "oracao"]) {
    assert.ok(ids.includes(id), `seção ausente: ${id}`);
  }
});
