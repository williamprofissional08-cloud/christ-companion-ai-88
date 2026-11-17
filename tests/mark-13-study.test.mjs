import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const study=fs.readFileSync("src/lib/content/mark-13-study.ts","utf8");
const catalog=fs.readFileSync("src/lib/content/curated-studies.ts","utf8");
const bible=JSON.parse(fs.readFileSync("src/lib/bible-livre/marcos.json","utf8"));

test("Marcos 13: 37 versículos em ordem e IDs únicos",()=>{
 const count=bible.chapters["13"].length;
 assert.equal(count,37);
 const ids=[...study.matchAll(/"id": "([^"]+)"/g)].map(m=>m[1]);
 assert.equal(ids.length,new Set(ids).size);
 assert.deepEqual(ids.filter(x=>/^versiculo-\d+$/.test(x)).map(x=>Number(x.split("-")[1])),Array.from({length:count},(_,i)=>i+1));
 for(const term of ["Paráfrase explicativa livre original","Oficina do pregador","Oração final","Referências cruzadas","Exercícios com respostas","esta geração","Daniel 7"]) assert.ok(study.includes(term),term);
 for(let i=1;i<=6;i++) assert.ok(ids.includes("pericope-"+i),"pericope "+i);
});

test("Marcos 13: registro único e import correto",()=>{
 assert.equal((catalog.match(/"biblia-marcos-cap-13"\s*:\s*mark13Study/g)||[]).length,1);
 assert.equal((catalog.match(/import \{ mark13Study \} from "\.\/mark-13-study";/g)||[]).length,1);
});
