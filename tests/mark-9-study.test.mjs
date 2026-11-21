import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const study = fs.readFileSync("src/lib/content/mark-9-study.ts","utf8");
const catalog = fs.readFileSync("src/lib/content/curated-studies.ts","utf8");
const bible = JSON.parse(fs.readFileSync("src/lib/bible-livre/marcos.json","utf8"));
test("Marcos 9: cobertura BLIVRE integral, IDs e catálogo únicos",()=>{
 const count=bible.chapters["9"].length;
 assert.equal(count,50);
 const ids=[...study.matchAll(/"id": "([^"]+)"/g)].map(m=>m[1]);
 assert.equal(ids.length,new Set(ids).size);
 const verses=ids.filter(id=>/^versiculo-\d+$/.test(id)).map(id=>Number(id.split("-")[1]));
 assert.deepEqual(verses,Array.from({length:count},(_,i)=>i+1));
 assert.match(study,/Paráfrase explicativa livre/);
 assert.match(study,/Oficina do pregador/);
 assert.match(study,/variante/);
 assert.equal((catalog.match(/"biblia-marcos-cap-9"\s*:/g)||[]).length,1);
 assert.equal((catalog.match(/import \{ mark9Study \}/g)||[]).length,1);
});
