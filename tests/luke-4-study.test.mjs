import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const source = fs.readFileSync("src/lib/content/luke-4-study.ts", "utf8");
const catalog = fs.readFileSync("src/lib/content/curated-studies.ts", "utf8");
const bible = JSON.parse(fs.readFileSync("src/lib/bible-livre/lucas.json", "utf8"));
test("Lucas 4: 44 versículos individuais e paráfrases sinalizadas", () => {
 const total = bible.chapters["4"].length;
 assert.equal(total,44);
 const verses = [...source.matchAll(/"id": "versiculo-(\d+)"/g)].map(m=>Number(m[1]));
 assert.deepEqual(verses,Array.from({length:total},(_,i)=>i+1));
 assert.equal((source.match(/Paráfrase explicativa livre original \(não é citação bíblica\)/g)||[]).length,total);
});
test("Lucas 4: seções únicas e componentes editoriais",()=>{
 const ids=[...source.matchAll(/"id": "([^"]+)"/g)].map(m=>m[1]);
 assert.equal(ids.length,58);
 assert.equal(ids.length,new Set(ids).size);
 for(const term of ["Oficina do pregador","Isaías","Deuteronômio","Oração","variantes","perguntas"])assert.ok(source.toLowerCase().includes(term.toLowerCase()),term);
});
test("Lucas 4: catálogo sem duplicação",()=>{
 assert.equal((catalog.match(/import \{ luke4Study \} from "\.\/luke-4-study";/g)||[]).length,1);
 assert.equal((catalog.match(/"biblia-lucas-cap-4": luke4Study/g)||[]).length,1);
});