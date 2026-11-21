import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const study = readFileSync(new URL("../src/lib/content/first-corinthians-11-study.ts", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");
const bible = JSON.parse(readFileSync(new URL("../src/lib/bible-livre/1-corintios.json", import.meta.url), "utf8"));
test("1 Coríntios 11: leitura integral de 34 versículos", () => {
  assert.equal(bible.chapters["11"].length, 34);
  for (let i=1;i<=34;i++) assert.match(study, new RegExp("\\*\\*"+i+"\\.\\*\\*"));
  assert.match(study,/Paráfrase livre original/);
});
test("1 Coríntios 11: seções e IDs únicos", () => {
  const ids=[...study.matchAll(/"id": "([^"]+)"/g)].map(x=>x[1]);
  assert.ok(ids.length>=40);
  assert.equal(new Set(ids).size,ids.length);
  for(let i=1;i<=34;i++) assert.ok(ids.includes("versiculo-"+i));
  for(const s of ["oficina-pregador","questoes-debatidas","oracao-final"]) assert.ok(ids.includes(s));
});
test("1 Coríntios 11: slug registrado uma vez",()=>{
  assert.equal((catalog.match(/"biblia-1-corintios-cap-11":/g)||[]).length,1);
  assert.match(catalog,/import \{ firstCorinthians11Study \} from "\.\/first-corinthians-11-study";/);
});
