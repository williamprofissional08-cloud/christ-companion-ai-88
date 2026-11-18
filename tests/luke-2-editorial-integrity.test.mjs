import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read=(p)=>fs.readFileSync(new URL(p,import.meta.url),"utf8");
const study=read("../src/lib/content/luke-2-study.ts");
const catalog=read("../src/lib/content/curated-studies.ts");
const bible=JSON.parse(read("../src/lib/bible-livre/lucas.json"));
test("Lucas 2: cobertura de todos os 52 versículos do BLIVRE",()=>{
 const total=bible.chapters["2"].length;
 assert.equal(total,52);
 const refs=[...study.matchAll(/"id": "versiculo-(\d+)"/g)].map(m=>Number(m[1]));
 assert.deepEqual(refs,Array.from({length:total},(_,i)=>i+1));
 for(let i=1;i<=total;i++)assert.ok(study.includes('"Lucas 2:'+i+'"'));
});
test("Lucas 2: IDs únicos, blocos editoriais e paráfrase sinalizada",()=>{
 const ids=[...study.matchAll(/"id": "([^"]+)"/g)].map(m=>m[1]);
 assert.equal(ids.length,new Set(ids).size);
 for(const term of ["Paráfrase explicativa livre original","Exposição contextual","Referências cruzadas comentadas","Perguntas e respostas","Oficina do pregador","Oração final","Questões debatidas"])assert.ok(study.includes(term),term);
});
test("Lucas 2: import e slug únicos no catálogo",()=>{
 assert.equal((catalog.match(/import \{ luke2Study \} from "\.\/luke-2-study";/g)||[]).length,1);
 assert.equal((catalog.match(/"biblia-lucas-cap-2": luke2Study/g)||[]).length,1);
});
