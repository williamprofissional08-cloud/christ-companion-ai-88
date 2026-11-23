import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const source=fs.readFileSync("src/lib/content/luke-7-study.ts","utf8");
const catalog=fs.readFileSync("src/lib/content/curated-studies.ts","utf8");
const bible=JSON.parse(fs.readFileSync("src/lib/bible-livre/lucas.json","utf8"));
test("Lucas 7: cobertura de todos os versículos",()=>{
 const total=bible.chapters["7"].length;assert.equal(total,50);
 const refs=[...source.matchAll(/"id": "versiculo-(\d+)"/g)].map(m=>Number(m[1]));
 assert.deepEqual(refs,Array.from({length:total},(_,i)=>i+1));
 assert.equal((source.match(/Paráfrase explicativa livre original \(não é citação bíblica\)/g)||[]).length,total);
});
test("Lucas 7: IDs únicos e estrutura",()=>{
 const ids=[...source.matchAll(/"id": "([^"]+)"/g)].map(m=>m[1]);
 assert.equal(ids.length,66);assert.equal(new Set(ids).size,ids.length);
 for(const token of ["Oficina do pregador","perdão","interpretação","revisão humana"])assert.ok(source.toLowerCase().includes(token.toLowerCase()),token);
});
test("Lucas 7: registro único",()=>{
 assert.equal((catalog.match(/import \{ luke7Study \} from "\.\/luke-7-study";/g)||[]).length,1);
 assert.equal((catalog.match(/"biblia-lucas-cap-7": luke7Study/g)||[]).length,1);
});