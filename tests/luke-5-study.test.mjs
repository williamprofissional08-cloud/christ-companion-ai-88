import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const source = fs.readFileSync("src/lib/content/luke-5-study.ts", "utf8");
const catalog = fs.readFileSync("src/lib/content/curated-studies.ts", "utf8");
const bible = JSON.parse(fs.readFileSync("src/lib/bible-livre/lucas.json", "utf8"));
test("Lucas 5: 39 versículos individuais", () => {
 const n = bible.chapters["5"].length;
 assert.equal(n,39);
 const ids = [...source.matchAll(/"id": "versiculo-(\d+)"/g)].map(x=>Number(x[1]));
 assert.deepEqual(ids,Array.from({length:n},(_,i)=>i+1));
 assert.equal((source.match(/Paráfrase explicativa livre original \(não é citação bíblica\)/g)||[]).length,n);
});
test("Lucas 5: seções e salvaguardas", () => {
 const ids=[...source.matchAll(/"id": "([^"]+)"/g)].map(x=>x[1]);
 assert.equal(ids.length,53);
 assert.equal(new Set(ids).size,ids.length);
 for(const token of ["Oficina do pregador","interpretação","deficiência","jejum","revisão editorial humana"])assert.ok(source.toLowerCase().includes(token.toLowerCase()),token);
});
test("Lucas 5: catálogo sem duplicidade",()=>{
 assert.equal((catalog.match(/import \{ luke5Study \} from "\.\/luke-5-study";/g)||[]).length,1);
 assert.equal((catalog.match(/"biblia-lucas-cap-5": luke5Study/g)||[]).length,1);
});
