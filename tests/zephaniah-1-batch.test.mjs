import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const root=new URL("../",import.meta.url);
test("Sofonias 1: all verses, editorial sections and catalog",()=>{
 const bible=JSON.parse(fs.readFileSync(new URL("src/lib/bible-livre/sofonias.json",root),"utf8"));
 const study=fs.readFileSync(new URL("src/lib/content/sofonias-1-study.ts",root),"utf8");
 const catalog=fs.readFileSync(new URL("src/lib/content/curated-studies.ts",root),"utf8");
 const verses=[...study.matchAll(/"id": "versiculo-(\d+)"/g)].map(m=>Number(m[1]));
 assert.deepEqual(verses,Array.from({length:bible.chapters["1"].length},(_,i)=>i+1));
 assert.equal((catalog.match(/"biblia-sofonias-cap-1"\s*:/g)||[]).length,1);
 for(const id of ["leitura","contexto","estrutura","termos","debates","teologia","referencias","cristo","distincoes","aplicacao","resumo","exercicios","pregador","oracao"])assert.ok(study.includes('"id": "'+id+'"'),id);
});
