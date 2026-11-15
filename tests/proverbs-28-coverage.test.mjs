import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const root=new URL("../",import.meta.url);
test("Proverbs 28: all BLIVRE verses and required editorial sections",()=>{
 const bible=JSON.parse(fs.readFileSync(new URL("src/lib/bible-livre/proverbios.json",root),"utf8"));
 const study=fs.readFileSync(new URL("src/lib/content/proverbs-28-study.ts",root),"utf8");
 const catalog=fs.readFileSync(new URL("src/lib/content/curated-studies.ts",root),"utf8");
 const n=bible.chapters["28"].length;
 assert.equal(n,28);
 const verses=[...study.matchAll(/"id": "versiculo-(\d+)"/g)].map(m=>Number(m[1]));
 assert.deepEqual(verses,Array.from({length:n},(_,i)=>i+1));
 assert.equal((catalog.match(/"biblia-proverbios-cap-28"\s*:/g)||[]).length,1);
 for(const id of ["leitura","contexto","estrutura","termos","debates","teologia","referencias","cristo","distincoes","aplicacao","resumo","exercicios","pregador","oracao"])assert.ok(study.includes('"id": "'+id+'"'),id);
});
