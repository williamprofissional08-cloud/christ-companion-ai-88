import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const root=new URL("../",import.meta.url);
test("Ageu 2: complete verse coverage and unique catalog registration",()=>{
 const bible=JSON.parse(fs.readFileSync(new URL("src/lib/bible-livre/ageu.json",root),"utf8"));
 const study=fs.readFileSync(new URL("src/lib/content/ageu-2-study.ts",root),"utf8");
 const catalog=fs.readFileSync(new URL("src/lib/content/curated-studies.ts",root),"utf8");
 const verses=[...study.matchAll(/"id": "versiculo-(\d+)"/g)].map(m=>Number(m[1]));
 assert.deepEqual(verses,Array.from({length:bible.chapters["2"].length},(_,i)=>i+1));
 assert.equal((catalog.match(/"biblia-ageu-cap-2"\s*:/g)||[]).length,1);
 for(const id of ["leitura","contexto","estrutura","termos","debates","teologia","referencias","cristo","distincoes","aplicacao","resumo","exercicios","pregador","oracao"])assert.ok(study.includes('"id": "'+id+'"'),id);
});
