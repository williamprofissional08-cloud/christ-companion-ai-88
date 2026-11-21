import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const study = readFileSync(new URL("../src/lib/content/ephesians-4-study.ts", import.meta.url),"utf8");
const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url),"utf8");
const bible = JSON.parse(readFileSync(new URL("../src/lib/bible-livre/efesios.json", import.meta.url),"utf8"));
test("Efésios 4 tem 32 versículos no acervo",()=>assert.equal(bible.chapters["4"].length,32));
test("paráfrase identificada e todos os 32 marcadores",()=>{
 assert.match(study,/Paráfrase livre original para estudo/);
 for(let i=1;i<=32;i++){assert.ok(study.includes("**"+i+".**"),"Leitura v."+i);assert.ok(study.includes('"id": "exposicao-v'+i+'"'),"Exposição v."+i);}
});
test("IDs de seção únicos e elementos editoriais",()=>{
 const ids=[...study.matchAll(/"id": "([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);assert.ok(ids.length>=45);
 for(const id of ["contexto","interpretacao","referencias","cuidado","aplicacao","exercicios","pregador","oracao"])assert.ok(ids.includes(id),id);
});
test("catálogo contém exatamente um import e um slug",()=>{
 assert.equal((catalog.match(/import \{ ephesians4Study \} from "\.\/ephesians-4-study";/g)||[]).length,1);
 assert.equal((catalog.match(/"biblia-efesios-cap-4": ephesians4Study/g)||[]).length,1);
});
