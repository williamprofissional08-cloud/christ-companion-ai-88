import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const catalog=readFileSync(new URL("../src/lib/content/curated-studies.ts",import.meta.url),"utf8");
const bible=JSON.parse(readFileSync(new URL("../src/lib/bible-livre/proverbios.json",import.meta.url),"utf8"));
const cases=[{"chapter":3,"verses":35,"ids":["exercicios","oficina-pregador","oracao","interpretacoes","cristo"]},{"chapter":4,"verses":27,"ids":["contexto","estrutura","referencias","interpretacoes","exercicios","oficina-pregador","oracao"]},{"chapter":5,"verses":23,"ids":["contexto","estrutura","referencias","interpretacoes","exercicios","oficina-pregador","oracao"]},{"chapter":6,"verses":35,"ids":["estrutura","referencias","interpretacoes","cristo","exercicios","oficina-pregador","oracao"]},{"chapter":7,"verses":27,"ids":["estrutura","referencias","interpretacoes","cristo","exercicios","oficina-pregador","oracao"]},{"chapter":8,"verses":36,"ids":["estrutura","termos","debate-criacao","referencias","cristo","interpretacoes","exercicios","oficina-pregador","oracao"]},{"chapter":9,"verses":18,"ids":["estrutura","exegese-1-6","exegese-7-12","exegese-13-18","referencias","interpretacoes","exercicios","oficina-pregador","oracao"]}];
for(const {chapter,verses,ids} of cases){
 test("Provérbios "+chapter+" — catálogo, "+verses+" versículos, IDs editoriais",()=>{
  const source=readFileSync(new URL("../src/lib/content/proverbs-"+chapter+"-study.ts",import.meta.url),"utf8");
  const start=source.indexOf(" = {\n"),end=source.lastIndexOf(";\n");
  assert.ok(start>=0&&end>start);
  const study=JSON.parse(source.slice(start+3,end));
  assert.equal(bible.chapters[String(chapter)].length,verses);
  const sections=study.sections??[];
  assert.equal((catalog.match(new RegExp('"biblia-proverbios-cap-'+chapter+'": proverbs'+chapter+'Study',"g"))??[]).length,1);
  const reading=sections.find(s=>s.id==="leitura-biblica");
  assert.ok(reading?.body.includes("Paráfrase livre"));
  for(let v=1;v<=verses;v++){
   assert.ok(reading.body.includes("**"+v+".**"),"Missing verse "+v);
   assert.ok(sections.some(s=>s.id==="versiculo-"+v),"Missing exegesis "+v);
  }
  for(const id of ids)assert.ok(sections.some(s=>s.id===id),"Missing section "+id);
  assert.equal(new Set(sections.map(s=>s.id)).size,sections.length);
 });
}
