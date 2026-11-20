import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const root = new URL("../", import.meta.url);
const source = readFileSync(new URL("src/lib/content/first-corinthians-5-study.ts", root), "utf8");
const bible = JSON.parse(readFileSync(new URL("src/lib/bible-livre/1-corintios.json", root), "utf8"));
const catalog = readFileSync(new URL("src/lib/content/curated-studies.ts", root), "utf8");
test("1 Coríntios 5: 13 versículos na fonte e paráfrase integral", () => {
  assert.equal(bible.chapters["5"].length, 13);
  const reading = source.match(/"id": "leitura-integral"[\s\S]*?"id": "contexto-estrutura"/)?.[0] ?? "";
  for(let n=1;n<=13;n++) assert.match(reading, new RegExp("\\\\n\\\\n\\\\*\\\\*"+n+"\\\\\\.\\\\*\\\\*|\\\\*\\\\*"+n+"\\\\\\.\\\\*\\\\*"));
  assert.match(source,/paráfrase livre original/i);
});
test("1 Coríntios 5: exposição individual, perícopes e proteção pastoral", () => {
  for(let n=1;n<=13;n++) assert.ok(source.includes('"id": "versiculo-'+n+'"'));
  for(const r of ["1-2","3-5","6-8","9-11","12-13"]) assert.ok(source.includes('"id": "pericope-'+r+'"'));
  for(const s of ["oficina-pregador","perguntas-respostas","referencias-cruzadas","cuidados-pastorais","oracao"]) assert.ok(source.includes('"id": "'+s+'"'));
  assert.match(source,/proteção das pessoas|proteger pessoas|proteção de pessoas/i);
});
test("1 Coríntios 5: slug e import únicos", () => {
  assert.equal((catalog.match(/"biblia-1-corintios-cap-5":/g)??[]).length,1);
  assert.equal((catalog.match(/import \{ firstCorinthians5Study \}/g)??[]).length,1);
});
