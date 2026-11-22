import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const root=new URL("../",import.meta.url);
const read=p=>readFileSync(new URL(p,root),"utf8");
const source=read("src/lib/content/romans-7-study.ts");
const study=JSON.parse(source.split("= ")[1].replace(/;\s*$/,""));
const verses=JSON.parse(read("src/lib/bible-livre/romanos.json")).chapters["7"];
const catalog=read("src/lib/content/curated-studies.ts");
test("Romanos 7: cobertura integral dos 25 versículos",()=>{
 assert.equal(verses.length,25);
 const reading=study.sections.find(s=>s.id==="leitura-livre-romanos-7");
 assert.match(reading.title,/paráfrase livre original/i);
 for(let i=1;i<=25;i++){
  assert.ok(reading.body.includes("**"+i+"** "), "paráfrase "+i);
  const s=study.sections.find(s=>s.id==="exegese-verso-"+i);
  assert.ok(s?.scriptureRefs.includes("Romanos 7:"+i) && s.body.length>180,"exegese "+i);
 }
});
test("Romanos 7: seções únicas e cuidado editorial",()=>{
 const ids=study.sections.map(s=>s.id);
 assert.equal(ids.length,new Set(ids).size);
 assert.ok(ids.length>=40);
 for(const id of ["contexto-historico","genero-estrutura","termos-gregos","cruzadas-comentadas","debates-interpretativos","cuidados-pastorais","perguntas-respostas","oficina-pregador","oracao-final"])assert.ok(ids.includes(id),id);
 assert.match(source,/revisão humana pendente/i);
});
test("Romanos 7: integração única no catálogo",()=>{
 assert.equal((catalog.match(/"biblia-romanos-cap-7"\s*:/g)||[]).length,1);
 assert.equal(catalog.split('import { romans7Study } from "./romans-7-study";').length-1,1);
});
