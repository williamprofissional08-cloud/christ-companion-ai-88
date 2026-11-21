import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const study = fs.readFileSync("src/lib/content/mark-16-study.ts","utf8");
const catalog = fs.readFileSync("src/lib/content/curated-studies.ts","utf8");
const bible = JSON.parse(fs.readFileSync("src/lib/bible-livre/marcos.json","utf8"));
test("Marcos 16: todos os versículos BLIVRE têm exposição individual", () => {
  const n = bible.chapters["16"].length;
  assert.equal(n, 20);
  const refs = [...study.matchAll(/"title": "Marcos 16:(\d+) — leitura e exposição"/g)].map(x=>Number(x[1]));
  assert.deepEqual(refs, Array.from({length:n},(_,i)=>i+1));
  assert.equal((study.match(/Paráfrase explicativa livre original/g)||[]).length,n);
});
test("Marcos 16: IDs únicos e nota crítica do final longo",()=>{
  const ids=[...study.matchAll(/"id": "([^"]+)"/g)].map(x=>x[1]);
  assert.equal(ids.length,new Set(ids).size);
  assert.ok(ids.length>=30);
  assert.match(study,/16:9–20/);
  assert.match(study,/manuscrit/);
  assert.match(study,/veneno/);
  assert.match(study,/Oficina do pregador/);
});
test("Marcos 16: registro único no catálogo",()=>{
  assert.equal((catalog.match(/import \{ mark16Study \} from "\.\/mark-16-study";/g)||[]).length,1);
  assert.equal((catalog.match(/"biblia-marcos-cap-16": mark16Study/g)||[]).length,1);
});
