import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const study = readFileSync(new URL("../src/lib/content/second-corinthians-8-study.ts", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");
const livre = JSON.parse(readFileSync(new URL("../src/lib/bible-livre/2-corintios.json", import.meta.url), "utf8"));
test("2 Coríntios 8: leitura completa e exposição por versículo", () => {
  const count = livre.chapters["8"].length;
  assert.equal(count, 24);
  for (let n=1;n<=count;n++) {
    assert.match(study, new RegExp("\\\\*\\\\*"+n+"\\\\.\\\\*\\\\*"));
    assert.ok(study.includes('"id": "exposicao-versiculo-'+n+'"'));
    assert.ok(study.includes('"2 Coríntios 8:'+n+'"'));
  }
});
test("2 Coríntios 8: integridade estrutural e cautelas editoriais", () => {
  const ids = [...study.matchAll(/"id": "([^"]+)"/g)].map(x=>x[1]);
  assert.equal(ids.length, new Set(ids).size);
  assert.ok(ids.length>=35);
  for (const phrase of ["Paráfrase livre original", "proporcional", "transparência", "pregador", "Oração final", "Êxodo 16:16-18"]) assert.ok(study.toLowerCase().includes(phrase.toLowerCase()),phrase);
});
test("2 Coríntios 8: slug e importação únicos", () => {
  assert.equal((catalog.match(/from "\\.\\/second-corinthians-8-study"/g)||[]).length,1);
  assert.equal((catalog.match(/slug: "biblia-2-corintios-cap-8"/g)||[]).length,1);
});
