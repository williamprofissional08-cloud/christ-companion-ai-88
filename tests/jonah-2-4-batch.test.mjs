import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const root=new URL("../",import.meta.url);
const bible=JSON.parse(fs.readFileSync(new URL("src/lib/bible-livre/jonas.json",root),"utf8"));
const catalog=fs.readFileSync(new URL("src/lib/content/curated-studies.ts",root),"utf8");
for(const chapter of [2,3,4]){
 test("Jonas "+chapter+": BLIVRE verse count, exposition, integration",()=>{
  const study=fs.readFileSync(new URL("src/lib/content/jonas-"+chapter+"-study.ts",root),"utf8");
  const count=bible.chapters[String(chapter)].length;
  const verses=[...study.matchAll(/"id": "versiculo-(\d+)"/g)].map(m=>Number(m[1]));
  assert.deepEqual(verses,Array.from({length:count},(_,i)=>i+1));
  for(let i=1;i<=count;i++)assert.ok(study.includes('"Jonas '+chapter+':'+i+'"'));
  assert.equal((catalog.match(new RegExp('"biblia-jonas-cap-'+chapter+'"\\s*:','g'))||[]).length,1);
  for(const id of ["leitura","contexto","estrutura","termos","debates","referencias","cristo","distincoes","aplicacao","exercicios","pregador","oracao"])assert.ok(study.includes('"id": "'+id+'"'),id);
 });
}
