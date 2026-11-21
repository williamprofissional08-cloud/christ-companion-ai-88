import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const root = new URL("../", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8");
const source = read("src/lib/content/acts-23-study.ts");
const catalog = read("src/lib/content/curated-studies.ts");
const verses = JSON.parse(read("src/lib/bible-livre/atos.json")).chapters["23"];
const study = JSON.parse(source.split("= ")[1].replace(/;\s*$/, ""));
test("Atos 23: leitura integral e comentário individual", () => {
  assert.equal(verses.length, 35);
  assert.equal(study.sections.filter(s => s.id.startsWith("exegese-verso-")).length, verses.length);
  const reading = study.sections.find(s => s.id === "leitura-livre-atos-23");
  assert.match(reading.title, /paráfrase livre original/i);
  for (let i=1; i<=verses.length; i++) {
    assert.ok(reading.body.includes("**"+i+"** "), "leitura "+i);
    assert.ok(study.sections.some(s=>s.id==="exegese-verso-"+i && s.scriptureRefs.includes("Atos 23:"+i) && s.body.length>180), "exposição "+i);
  }
});
test("Atos 23: seções, perícopes, IDs e cuidados", () => {
  const ids=study.sections.map(s=>s.id);
  assert.equal(ids.length,new Set(ids).size);
  for (const id of ["pericope-1-5","pericope-6-10","pericope-11-11","pericope-12-22","pericope-23-30","pericope-31-35","termos-interpretacoes","perguntas-respostas","oficina-pregador","oracao-final","passagens-sensiveis"]) assert.ok(ids.includes(id),id);
  assert.match(source,/antijudaísmo/);
});
test("Atos 23: registro único no catálogo",()=>{
 assert.equal((catalog.match(/"biblia-atos-cap-23"\s*:/g)||[]).length,1);
 assert.equal(catalog.split('import { acts23Study } from "./acts-23-study";').length-1,1);
});
