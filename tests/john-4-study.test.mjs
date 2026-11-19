import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const study = readFileSync(new URL("../src/lib/content/john-4-study.ts", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");
test("João 4: cobertura sequencial dos 54 versículos e IDs únicos", () => {
  const ids = [...study.matchAll(/"id": "([^"]+)"/g)].map(m => m[1]);
  assert.equal(ids.length, new Set(ids).size);
  assert.deepEqual(ids.filter(id => /^versiculo-\d+$/.test(id)), Array.from({length:54},(_,i)=>`versiculo-${i+1}`));
  for(let n=1;n<=54;n++) assert.ok(study.includes(`"João 4:${n}"`));
  assert.equal((study.match(/Paráfrase explicativa livre original \(não é tradução oficial\)/g)??[]).length,54);
  assert.match(study,/revisão editorial humana pendente/);
});
test("João 4: import e slug únicos no catálogo", () => {
  assert.equal((catalog.match(/"biblia-joao-cap-4": john4Study/g)??[]).length,1);
  assert.equal((catalog.match(/import \{ john4Study \} from "\.\/john-4-study";/g)??[]).length,1);
});
