import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const root = new URL("../", import.meta.url);
const study = fs.readFileSync(new URL("src/lib/content/jonas-1-study.ts",root),"utf8");
const catalog = fs.readFileSync(new URL("src/lib/content/curated-studies.ts",root),"utf8");
const bible = JSON.parse(fs.readFileSync(new URL("src/lib/bible-livre/jonas.json",root),"utf8"));
test("Jonas 1: BLIVRE count and complete verse exposition",()=>{
 const count=bible.chapters["1"].length;
 assert.equal(count,17);
 const verses=[...study.matchAll(/"id": "versiculo-(\\d+)"/g)].map(m=>Number(m[1]));
 assert.deepEqual(verses,Array.from({length:count},(_,i)=>i+1));
 for(let n=1;n<=count;n++) assert.ok(study.includes('"Jonas 1:'+n+'"'));
});
test("Jonas 1: stable catalog ID and no duplicate mapping",()=>{
 assert.match(catalog,/import \\{ jonas1Study \\} from "\\.\\/jonas-1-study";/);
 assert.equal((catalog.match(/"biblia-jonas-cap-1"\\s*:/g)||[]).length,1);
});
test("Jonas 1: required editorial blocks",()=>{
 for(const id of ["leitura","contexto","estrutura","termos","teologia","debates","referencias","cristo","distincoes","aplicacao","resumo","exercicios","pregador","oracao"]) assert.ok(study.includes('"id": "'+id+'"'),id);
 assert.match(study,/revisão humana pendente/);
});
