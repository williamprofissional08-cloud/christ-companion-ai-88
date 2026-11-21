import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const study=readFileSync(new URL("../src/lib/content/hebrews-13-study.ts",import.meta.url),"utf8");
const catalog=readFileSync(new URL("../src/lib/content/curated-studies.ts",import.meta.url),"utf8");
const bible=JSON.parse(readFileSync(new URL("../src/lib/bible-livre/hebreus.json",import.meta.url),"utf8"));
test("Hebreus 13 cobre todos os versículos do acervo",()=>{assert.equal(bible.chapters["13"].length,25);for(let v=1;v<=25;v++){assert.match(study,new RegExp('id": "versiculo-'+v+'"'));assert.match(study,new RegExp('Hebreus 13:'+v));} });
test("IDs e registro único no catálogo",()=>{const ids=[...study.matchAll(/"id": "([^"]+)"/g)].map(x=>x[1]);assert.equal(new Set(ids).size,ids.length);assert.equal((catalog.match(/"biblia-hebreus-cap-13"\s*:/g)||[]).length,1);assert.equal((catalog.match(/import \{ hebrews13Study \}/g)||[]).length,1);});
test("campos e seções editoriais",()=>{for(const key of ["intro","historicalContext","keyPoints","crossReferences","questions","conclusion","prayer","sections"])assert.match(study,new RegExp('"'+key+'"'));for(const id of ["leitura","contexto","estrutura","termos","referencias","debates","aplicacao","exercicios","pregador","oracao"])assert.match(study,new RegExp('"id": "'+id+'"'));});
