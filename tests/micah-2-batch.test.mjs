import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const root=new URL("../",import.meta.url);
test("Miqueias 2: BLIVRE, complete verse coverage and curated catalog",()=>{
 const bible=JSON.parse(fs.readFileSync(new URL("src/lib/bible-livre/miqueias.json",root),"utf8"));
 const study=fs.readFileSync(new URL("src/lib/content/miqueias-2-study.ts",root),"utf8");
 const catalog=fs.readFileSync(new URL("src/lib/content/curated-studies.ts",root),"utf8");
 const count=bible.chapters["2"].length;
 assert.equal(count,13);
 const verses=[...study.matchAll(/"id": "versiculo-(\d+)"/g)].map(m=>Number(m[1]));
 assert.deepEqual(verses,Array.from({length:count},(_,i)=>i+1));
 for(let i=1;i<=count;i++)assert.ok(study.includes('"Miqueias 2:'+i+'"'));
 assert.equal((catalog.match(/"biblia-miqueias-cap-2"\s*:/g)||[]).length,1);
 for(const id of ["leitura","contexto","estrutura","termos","debates","teologia","referencias","cristo","distincoes","aplicacao","resumo","exercicios","pregador","oracao"])assert.ok(study.includes('"id": "'+id+'"'),id);
});
