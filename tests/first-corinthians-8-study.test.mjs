import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const root = new URL("../", import.meta.url);
const study = readFileSync(new URL("src/lib/content/first-corinthians-8-study.ts", root), "utf8");
const catalog = readFileSync(new URL("src/lib/content/curated-studies.ts", root), "utf8");
const bible = JSON.parse(readFileSync(new URL("src/lib/bible-livre/1-corintios.json", root), "utf8"));
test("1 Coríntios 8 — leitura completa, exposição e IDs únicos", () => {
  const verses = bible.chapters["8"];
  assert.equal(verses.length, 13);
  assert.match(study, /paráfrase livre original/i);
  const ids = [...study.matchAll(/"id": "([^"]+)"/g)].map(x => x[1]);
  assert.equal(ids.length, new Set(ids).size);
  assert.ok(ids.length >= 20);
  for (let n = 1; n <= verses.length; n++) {
    assert.match(study, new RegExp('"id": "versiculo-' + n + '"'));
    assert.match(study, new RegExp('1 Coríntios 8:' + n + '(?![0-9])'));
    assert.match(study, new RegExp('\\*\\*' + n + '\\.\\*\\*'));
  }
  for (const id of ["leitura-integral", "contexto-literario", "questoes-interpretativas", "perguntas-respostas", "oficina-pregador", "oracao"]) assert.ok(ids.includes(id));
});
test("1 Coríntios 8 — mapeamento único no catálogo", () => {
  assert.equal((catalog.match(/"biblia-1-corintios-cap-8"\s*:/g) || []).length, 1);
  assert.equal((catalog.match(/import \{ firstCorinthians8Study \} from/g) || []).length, 1);
});
