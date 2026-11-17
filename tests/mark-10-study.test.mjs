import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const study=fs.readFileSync("src/lib/content/mark-10-study.ts","utf8");
const catalog=fs.readFileSync("src/lib/content/curated-studies.ts","utf8");
const bible=JSON.parse(fs.readFileSync("src/lib/bible-livre/marcos.json","utf8"));
test("Marcos 10: versículos, IDs, conteúdo e catálogo",()=>{
 const count=bible.chapters["10"].length;
 assert.equal(count,52);
 const ids=[...study.matchAll(/"id": "([^"]+)"/g)].map(m=>m[1]);
 assert.equal(ids.length,new Set(ids).size);
 assert.deepEqual(ids.filter(x=>/^versiculo-\d+$/.test(x)).map(x=>Number(x.split("-")[1])),Array.from({length:count},(_,i)=>i+1));
 for(const term of ["Paráfrase explicativa livre","Oficina do pregador","Oração final","Referências cruzadas","Exercícios com respostas"]) assert.ok(study.includes(term),term);
 assert.equal((catalog.match(/"biblia-marcos-cap-10"\s*:/g)||[]).length,1);
 assert.equal((catalog.match(/import \{ mark10Study \}/g)||[]).length,1);
});
