import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const study=readFileSync(new URL("../src/lib/content/hebrews-12-study.ts",import.meta.url),"utf8");
const catalog=readFileSync(new URL("../src/lib/content/curated-studies.ts",import.meta.url),"utf8");
const bible=JSON.parse(readFileSync(new URL("../src/lib/bible-livre/hebreus.json",import.meta.url),"utf8"));
test("Hebreus 12 contempla todos os versículos",()=>{
  assert.equal(bible.chapters["12"].length,29);
  for(let v=1;v<=29;v++){
    assert.match(study,new RegExp('"id": "versiculo-'+v+'"'));
    assert.match(study,new RegExp('Hebreus 12:'+v+'(?:[^0-9]|$)'));
    assert.match(study,new RegExp('\\*\\*'+v+'\\.\\*\\*'));
  }
});
test("Hebreus 12 possui IDs únicos e entrada única no catálogo",()=>{
 const ids=[...study.matchAll(/"id": "([^"]+)"/g)].map(x=>x[1]);
 assert.equal(new Set(ids).size,ids.length);
 assert.equal((catalog.match(/"biblia-hebreus-cap-12"\\s*:/g)||[]).length,1);
 assert.equal((catalog.match(/import \\{ hebrews12Study \\}/g)||[]).length,1);
});
test("Hebreus 12 apresenta componentes editoriais",()=>{
 for(const key of ["intro","historicalContext","keyPoints","crossReferences","questions","conclusion","prayer","sections"]) assert.match(study,new RegExp('"'+key+'"'));
 for(const id of ["leitura","contexto","estrutura","termos","referencias","debates","aplicacao","exercicios","pregador","oracao"]) assert.match(study,new RegExp('"id": "'+id+'"'));
});