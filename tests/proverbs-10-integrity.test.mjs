import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const src=readFileSync(new URL("../src/lib/content/proverbs-10-study.ts",import.meta.url),"utf8");
const cat=readFileSync(new URL("../src/lib/content/curated-studies.ts",import.meta.url),"utf8");
const bible=JSON.parse(readFileSync(new URL("../src/lib/bible-livre/proverbios.json",import.meta.url),"utf8"));
const start=src.indexOf(" = {\n"),end=src.lastIndexOf(";\n");
const study=JSON.parse(src.slice(start+3,end));
test("Provérbios 10 — leitura de 32 versos e integração",()=>{
 assert.equal(bible.chapters["10"].length,32);
 assert.match(cat,/"biblia-proverbios-cap-10": proverbs10Study/);
 const sections=study.sections??[],reading=sections.find(s=>s.id==="leitura-biblica");
 assert.ok(reading?.body?.includes("Paráfrase livre"));
 for(let v=1;v<=32;v++){
  assert.ok(reading.body.includes("**"+v+".**"),"Leitura faltando versículo "+v);
  assert.ok(sections.some(s=>s.id==="versiculo-"+v),"Exegese faltando versículo "+v);
 }
 for(const id of ["contexto","estrutura","paralelismo","termos","referencias","interpretacoes","cristo","exercicios","oficina-pregador","oracao"])assert.ok(sections.some(s=>s.id===id),"Seção faltando "+id);
 assert.equal(new Set(sections.map(s=>s.id)).size,sections.length);
});
