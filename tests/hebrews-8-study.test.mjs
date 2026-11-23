import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../src/lib/content/hebrews-8-study.ts", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");
test("Hebreus 8 contém leitura livre completa e sequencial", () => {
  assert.match(source, /Paráfrase livre original/);
  for (let verse = 1; verse <= 13; verse++) {
    assert.ok(source.includes(`**${verse}.**`), `versículo ${verse} ausente`);
    assert.ok(source.includes(`"id": "exposicao-versiculo-${verse}"`), `exposição ${verse} ausente`);
  }
  assert.ok(!source.includes("**14.**"));
});
test("Hebreus 8 inclui elementos editoriais essenciais", () => {
  for (const id of ["contexto", "estrutura", "pericopes", "referencias", "interpretacao", "cuidado", "aplicacao", "perguntas", "oficina", "oracao"]) {
    assert.ok(source.includes(`"id": "${id}"`), `seção ${id} ausente`);
  }
  const ids = [...source.matchAll(/"id": "([^"]+)"/g)].map(x => x[1]);
  assert.equal(ids.length, new Set(ids).size);
});
test("Hebreus 8 tem registro único no catálogo", () => {
  assert.equal((catalog.match(/"biblia-hebreus-cap-8":/g) || []).length, 1);
  assert.equal((catalog.match(/import \{ hebrews8Study \} from "\.\/hebrews-8-study";/g) || []).length, 1);
});
