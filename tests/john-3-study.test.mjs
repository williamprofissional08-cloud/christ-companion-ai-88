import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const study = readFileSync(new URL("../src/lib/content/john-3-study.ts", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");
test("João 3: 36 versículos em ordem e IDs únicos", () => {
  const ids = [...study.matchAll(/"id": "([^"]+)"/g)].map(m => m[1]);
  assert.equal(ids.length, new Set(ids).size);
  assert.deepEqual(ids.filter(id => /^versiculo-\d+$/.test(id)), Array.from({length:36},(_,i)=>`versiculo-${i+1}`));
  for(let n=1;n<=36;n++) assert.ok(study.includes(`"João 3:${n}"`));
  assert.equal((study.match(/Paráfrase explicativa original/g)??[]).length,36);
});
test("João 3: registro único no catálogo", () => {
  assert.equal((catalog.match(/"biblia-joao-cap-3": john3Study/g)??[]).length,1);
  assert.equal((catalog.match(/import \{ john3Study \} from "\.\/john-3-study";/g)??[]).length,1);
});