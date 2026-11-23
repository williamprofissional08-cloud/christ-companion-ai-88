import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const study = readFileSync(new URL("../../src/lib/content/second-thessalonians-2-study.ts", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../../src/lib/content/curated-studies.ts", import.meta.url), "utf8");
test("2 Thessalonians 2 has complete verse-by-verse study and unique catalog slug", () => {
 const verses = [...study.matchAll(/"id": "versiculo-(\d+)"/g)].map(m=>Number(m[1]));
 assert.deepEqual(verses,Array.from({length:17},(_,i)=>i+1));
 const ids=[...study.matchAll(/"id": "([^"]+)"/g)].map(m=>m[1]);
 assert.equal(ids.length,new Set(ids).size);
 assert.match(study,/Paráfrase livre original/);
 assert.match(study,/Oficina do pregador/);
 assert.match(study,/Oração final/);
 assert.equal(catalog.split('"biblia-2-tessalonicenses-cap-2":').length-1,1);
 assert.equal(catalog.split('import { secondThessalonians2Study }').length-1,1);
});
