import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const study=fs.readFileSync("src/lib/content/mark-15-study.ts","utf8");
const catalog=fs.readFileSync("src/lib/content/curated-studies.ts","utf8");
const bible=JSON.parse(fs.readFileSync("src/lib/bible-livre/marcos.json","utf8"));

test("Marcos 15: 47 versículos, ordem e IDs únicos",()=>{
 const count=bible.chapters["15"].length;
 assert.equal(count,47);
 const ids=[...study.matchAll(/"id": "([^"]+)"/g)].map(m=>m[1]);
 assert.equal(ids.length,65);
 assert.equal(ids.length,new Set(ids).size);
 assert.deepEqual(ids.filter(x=>/^versiculo-\d+$/.test(x)).map(x=>Number(x.split("-")[1])),Array.from({length:count},(_,i)=>i+1));
 for(let i=1;i<=count;i++)assert.ok(study.includes('"Marcos 15:'+i+'"'),"Referência do versículo "+i);
 for(const id of ["leitura","contexto","estrutura","debates","referencias","cristo","aplicacao","perguntas","exercicios","pregador","oracao"])assert.ok(ids.includes(id),id);
});
test("Marcos 15: import e slug únicos no catálogo",()=>{
 assert.equal((catalog.match(/import \{ mark15Study \} from "\.\/mark-15-study";/g)||[]).length,1);
 assert.equal((catalog.match(/"biblia-marcos-cap-15": mark15Study,/g)||[]).length,1);
});
