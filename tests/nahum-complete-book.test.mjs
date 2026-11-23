import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const root=new URL("../",import.meta.url);
test("Naum: three chapters with full verse coverage and unique catalog IDs",()=>{
 const bible=JSON.parse(fs.readFileSync(new URL("src/lib/bible-livre/naum.json",root),"utf8"));
 const catalog=fs.readFileSync(new URL("src/lib/content/curated-studies.ts",root),"utf8");
 for(let chapter=1;chapter<=3;chapter++){
  const study=fs.readFileSync(new URL("src/lib/content/naum-"+chapter+"-study.ts",root),"utf8");
  const verses=[...study.matchAll(/"id": "versiculo-(\d+)"/g)].map(m=>Number(m[1]));
  assert.deepEqual(verses,Array.from({length:bible.chapters[String(chapter)].length},(_,i)=>i+1),"Naum "+chapter);
  assert.equal((catalog.match(new RegExp('"biblia-naum-cap-'+chapter+'"\\s*:','g'))||[]).length,1,"catalog "+chapter);
  for(const id of ["leitura","contexto","estrutura","termos","debates","teologia","referencias","cristo","distincoes","aplicacao","resumo","exercicios","pregador","oracao"])assert.ok(study.includes('"id": "'+id+'"'),chapter+" "+id);
 }
});
