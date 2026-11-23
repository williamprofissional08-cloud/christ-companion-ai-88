import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(resolve(root, "src/lib/content/second-thessalonians-1-study.ts"), "utf8");
const catalog = readFileSync(resolve(root, "src/lib/content/curated-studies.ts"), "utf8");
const bible = JSON.parse(readFileSync(resolve(root, "src/lib/bible-livre/2-tessalonicenses.json"), "utf8"));

test("2 Tessalonicenses 1: leitura e exposição de todos os versículos", () => {
  assert.equal(bible.chapters["1"].length, 12);
  for (let n = 1; n <= 12; n++) {
    assert.match(source, new RegExp('\\*\\*' + n + '\\.\\*\\*'));
    assert.match(source, new RegExp('"id": "versiculo-' + n + '"'));
    assert.match(source, new RegExp('"2 Tessalonicenses 1:' + n + '"'));
  }
});
test("2 Tessalonicenses 1: IDs únicos e seções editoriais", () => {
  const ids = [...source.matchAll(/"id": "([^"]+)"/g)].map(x => x[1]);
  assert.equal(ids.length, new Set(ids).size);
  assert.ok(ids.length >= 25);
  for (const id of ["leitura-integral","contexto","estrutura","referencias","interpretacoes","perguntas","oficina","oracao"]) {
    assert.ok(ids.includes(id), id);
  }
  assert.match(source, /Paráfrase livre original/);
});
test("2 Tessalonicenses 1: registro único no catálogo", () => {
  assert.equal((catalog.match(/"biblia-2-tessalonicenses-cap-1":/g) || []).length, 1);
  assert.equal((catalog.match(/import \{ secondThessalonians1Study \}/g) || []).length, 1);
});
