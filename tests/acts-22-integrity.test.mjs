import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const root=new URL("../",import.meta.url);
const read=p=>readFileSync(new URL(p,root),"utf8");
const source=read("src/lib/content/acts-22-study.ts");
const catalog=read("src/lib/content/curated-studies.ts");
const verses=JSON.parse(read("src/lib/bible-livre/atos.json")).chapters["22"];
test("Atos 22: leitura e comentários para cada versículo",()=>{
 assert.equal(verses.length,30);
 const reading=source.split('"id": "leitura-livre-atos-22"')[1]?.split('"id": "introducao-objetivos"')[0];
 assert.ok(reading);assert.match(reading,/Paráfrase livre original/);
 for(let i=1;i<=verses.length;i++){assert.ok(reading.includes("**"+i+"** "),"leitura "+i);assert.ok(source.includes('"id": "exegese-verso-'+i+'"'));assert.ok(source.includes("Atos 22:"+i));}
});
test("Atos 22: IDs, perícopes e temas",()=>{
 const ids=[...source.matchAll(/"id": "([^"]+)"/g)].map(x=>x[1]);assert.equal(ids.length,new Set(ids).size);
 for(const s of ["pericope-1-5","pericope-6-11","pericope-12-16","pericope-17-21","pericope-22-24","pericope-25-30","termos-interpretacoes","perguntas-respostas","oficina-pregador","oracao-final","antijudaísmo"])assert.ok(source.includes(s),s);
});
test("Atos 22: catálogo único",()=>{
 assert.equal((catalog.match(/"biblia-atos-cap-22"\s*:/g)||[]).length,1);
 assert.equal(catalog.split('import { acts22Study } from "./acts-22-study";').length-1,1);
});
