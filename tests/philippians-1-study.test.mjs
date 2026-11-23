import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const study = readFileSync(new URL("../src/lib/content/philippians-1-study.ts", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");
const bible = JSON.parse(readFileSync(new URL("../src/lib/bible-livre/filipenses.json", import.meta.url), "utf8"));
test("Filipenses 1: 30 versículos e exposição própria",()=>{
 const total=bible.chapters["1"].length; assert.equal(total,30);
 for(let n=1;n<=total;n++){assert.ok(study.includes('"id": "versiculo-'+n+'"'));assert.ok(study.includes('"Filipenses 1:'+n+'"'));}
 assert.equal((study.match(/"id": "versiculo-\d+"/g)||[]).length,total);
 assert.equal((study.match(/\*\*Paráfrase livre original:/g)||[]).length,total);
 assert.equal((study.match(/\*\*Exposição contextual:/g)||[]).length,total);
});
test("Filipenses 1: IDs e catálogo",()=>{
 const ids=[...study.matchAll(/"id": "([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
 assert.equal(catalog.split('import { philippians1Study } from "./philippians-1-study";').length-1,1);
 assert.equal(catalog.split('"biblia-filipenses-cap-1": philippians1Study').length-1,1);
 for(const id of ["oficina-pregador","interpretacao-e-inferencia","perguntas-respostas"])assert.ok(ids.includes(id));
});
