import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const root = new URL("../", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8");
const source = read("src/lib/content/romans-6-study.ts");
const catalog = read("src/lib/content/curated-studies.ts");
const verses = JSON.parse(read("src/lib/bible-livre/romanos.json")).chapters["6"];
const study = JSON.parse(source.split("= ")[1].replace(/;\s*$/, ""));
test("Romanos 6: paráfrase autoral e exegese de todos os versos",()=>{
 assert.equal(verses.length,23);
 const reading=study.sections.find(s=>s.id==="leitura-livre-romanos-6");
 assert.match(reading.title,/paráfrase livre original/i);
 assert.equal(study.sections.filter(s=>s.id.startsWith("exegese-verso-")).length,23);
 for(let i=1;i<=23;i++){
  assert.ok(reading.body.includes("**"+i+"** "), "paráfrase "+i);
  const section=study.sections.find(s=>s.id==="exegese-verso-"+i);
  assert.ok(section?.scriptureRefs.includes("Romanos 6:"+i) && section.body.length>180,"exegese "+i);
 }
});
test("Romanos 6: estrutura e cuidados pastorais",()=>{
 const ids=study.sections.map(s=>s.id);
 assert.equal(ids.length,new Set(ids).size);
 for(const id of ["pericope-1-4","pericope-5-11","pericope-12-14","pericope-15-19","pericope-20-23","termos-interpretacoes","referencias-comentadas","passagens-sensiveis","perguntas-respostas","oficina-pregador","oracao-final"]) assert.ok(ids.includes(id),id);
 assert.match(source,/escravidão/);
});
test("Romanos 6: registro único",()=>{
 assert.equal((catalog.match(/"biblia-romanos-cap-6"\s*:/g)||[]).length,1);
 assert.equal(catalog.split('import { romans6Study } from "./romans-6-study";').length-1,1);
});
