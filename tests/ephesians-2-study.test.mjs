import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const study = readFileSync(new URL("../src/lib/content/ephesians-2-study.ts", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");
const reading = JSON.parse(readFileSync(new URL("../src/lib/bible-livre/efesios.json", import.meta.url), "utf8"));
test("Efésios 2: leitura completa, estrutura e catálogo", () => {
  assert.equal(reading.chapters["2"].length, 22);
  assert.match(study, /Paráfrase livre original/);
  const verses = [...study.matchAll(/\*\*(\d+)\.\*\*/g)].map(m => Number(m[1]));
  assert.deepEqual(verses, Array.from({length:22}, (_,i)=>i+1));
  const ids = [...study.matchAll(/"id": "([^"]+)"/g)].map(m=>m[1]);
  assert.ok(ids.length >= 30);
  assert.equal(new Set(ids).size, ids.length);
  for (const phrase of ["oficina-pregador","questoes-interpretativas","referencias-cruzadas","oracao-final"]) assert.ok(ids.includes(phrase));
  assert.equal((catalog.match(/import \{ ephesians2Study \} from "\.\/ephesians-2-study";/g)||[]).length,1);
  assert.equal((catalog.match(/"biblia-efesios-cap-2": ephesians2Study/g)||[]).length,1);
});
