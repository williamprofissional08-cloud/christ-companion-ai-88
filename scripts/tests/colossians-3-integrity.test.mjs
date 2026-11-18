import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { test } from "node:test";
const source = readFileSync(new URL("../../src/lib/content/colossians-3-study.ts", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../../src/lib/content/curated-studies.ts", import.meta.url), "utf8");
const bible = JSON.parse(readFileSync(new URL("../../src/lib/bible-livre/colossenses.json", import.meta.url), "utf8"));
test("Colossenses 3: cobertura e seções únicas", () => {
  assert.equal(bible.chapters["3"].length, 25);
  const ids = [...source.matchAll(/"id": "([^"]+)"/g)].map(m => m[1]);
  assert.ok(ids.length >= 18);
  assert.equal(ids.length, new Set(ids).size);
  for (let i = 1; i <= 25; i++) {
    assert.ok(ids.includes("versiculo-" + i), "versículo " + i);
    assert.ok(source.includes("**" + i + ".**"), "paráfrase " + i);
  }
  for (const id of ["leitura-integral","contexto","estrutura","interpretacao","referencias","aplicacao","perguntas","oficina","oracao"]) assert.ok(ids.includes(id), id);
  assert.match(source, /Paráfrase livre original/);
});
test("Colossenses 3: registro único no catálogo", () => {
  assert.equal((catalog.match(/"biblia-colossenses-cap-3"\s*:/g) ?? []).length, 1);
  assert.equal((catalog.match(/import \{ colossians3Study \} from "\.\/colossians-3-study";/g) ?? []).length, 1);
});
