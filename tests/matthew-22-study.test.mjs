import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const study = readFileSync(new URL("../src/lib/content/matthew-22-study.ts", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");
const bible = JSON.parse(readFileSync(new URL("../src/lib/bible-livre/mateus.json", import.meta.url), "utf8"));

test("Mateus 22 possui uma exposição para cada versículo do acervo", () => {
  const verses = bible.chapters["22"];
  assert.equal(verses.length, 46);
  const ids = [...study.matchAll(/"id": "versiculo-(\\d+)"/g)].map((match) => Number(match[1]));
  assert.deepEqual(ids, Array.from({ length: verses.length }, (_, i) => i + 1));
  for (let verse = 1; verse <= verses.length; verse++) {
    assert.ok(study.includes(`"Mateus 22:${verse}"`));
  }
});

test("Mateus 22 tem blocos editoriais e registro único no catálogo", () => {
  for (const id of ["leitura", "contexto", "estrutura", "termos", "debates", "referencias", "cristo", "distincoes", "aplicacao", "perguntas", "pregador", "oracao"]) {
    assert.ok(study.includes(`"id": "${id}"`), `seção ausente: ${id}`);
  }
  assert.equal((catalog.match(/"biblia-mateus-cap-22": matthew22Study/g) ?? []).length, 1);
  assert.equal((catalog.match(/import \\{ matthew22Study \\} from "\\.\\/matthew-22-study";/g) ?? []).length, 1);
});
