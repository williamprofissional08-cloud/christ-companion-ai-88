import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../src/lib/content/colossians-4-study.ts", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");
const bible = JSON.parse(readFileSync(new URL("../src/lib/bible-livre/colossenses.json", import.meta.url), "utf8"));
const start = source.indexOf(" = {\n"), end = source.lastIndexOf(";\n");
assert.ok(start >= 0 && end > start);
const study = JSON.parse(source.slice(start + 3, end));

test("Colossenses 4 — leitura, versículos e IDs", () => {
  const count = bible.chapters["4"].length;
  assert.equal(count, 18);
  assert.equal(study.version, 5);
  assert.equal(study.depth, "deep");
  const reading = study.sections.find(s => s.id === "leitura-integral");
  assert.ok(reading);
  assert.match(reading.body, /Paráfrase livre original/);
  assert.deepEqual([...reading.body.matchAll(/\\*\\*(\\d+)\\.\\*\\*/g)].map(m => +m[1]), Array.from({length:count},(_,i)=>i+1));
  assert.equal(new Set(study.sections.map(s => s.id)).size,study.sections.length);
  assert.equal(new Set(study.sections.map(s => s.title)).size,study.sections.length);
  for (let verse=1;verse<=count;verse++) {
    const section=study.sections.find(s=>s.id==="versiculo-"+verse);
    assert.ok(section);
    assert.ok(section.scriptureRefs.includes("Colossenses 4:"+verse));
    assert.match(section.body,/Observação e interpretação/);
  }
  for (const id of ["contexto","estrutura","referencias","interpretacoes","cuidados","perguntas","oficina","oracao"]) assert.ok(study.sections.some(s=>s.id===id));
});

test("Colossenses 4 — catálogo e cuidados", () => {
  assert.equal(catalog.split('import { colossians4Study } from "./colossians-4-study";').length,2);
  assert.equal(catalog.split('"biblia-colossenses-cap-4": colossians4Study').length,2);
  const all=study.sections.map(s=>s.body).join(" ");
  assert.match(all,/escravidão/);
  assert.match(all,/Laodiceia/);
  assert.match(all,/Onésimo/);
});
