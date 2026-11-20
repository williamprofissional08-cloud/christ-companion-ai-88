import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const study=readFileSync(new URL("../src/lib/content/first-corinthians-10-study.ts",import.meta.url),"utf8");
const catalog=readFileSync(new URL("../src/lib/content/curated-studies.ts",import.meta.url),"utf8");
const bible=JSON.parse(readFileSync(new URL("../src/lib/bible-livre/1-corintios.json",import.meta.url),"utf8"));
test("1 Coríntios 10 — 33 versículos e paráfrase original",()=>{
 assert.equal(bible.chapters["10"].length,33);
 assert.match(study,/Paráfrase livre original/);
 for(let n=1;n<=33;n++) assert.ok(study.includes("**"+n+".**"),"versículo "+n);
});
test("1 Coríntios 10 — seções e IDs únicos",()=>{
 const ids=[...study.matchAll(/"id": "([^"]+)"/g)].map(m=>m[1]);
 assert.ok(ids.length>=45);
 assert.equal(new Set(ids).size,ids.length);
 for(let n=1;n<=33;n++) assert.ok(ids.includes("versiculo-"+n));
 for(const id of ["questoes-debatidas","oficina-pregador","oracao-final","leitura-integral"]) assert.ok(ids.includes(id));
});
test("1 Coríntios 10 — catálogo sem duplicidade",()=>{
 assert.equal((catalog.match(/"biblia-1-corintios-cap-10":/g)||[]).length,1);
 assert.match(catalog,/import \{ firstCorinthians10Study \} from "\.\/first-corinthians-10-study";/);
});
