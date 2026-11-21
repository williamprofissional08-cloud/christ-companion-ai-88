import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const study = readFileSync(new URL("../src/lib/content/miqueias-4-study.ts", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");
test("Miqueias 4 cobre 13 versículos e seções editoriais", () => {
  const ids = [...study.matchAll(/"id": "versiculo-(\d+)"/g)].map(m => Number(m[1]));
  assert.deepEqual(ids, Array.from({ length: 13 }, (_, i) => i + 1));
  for (const section of ["contexto", "debates", "cristo", "exercicios", "pregador", "oracao"])
    assert.ok(study.includes('"id": "' + section + '"'), section);
});
test("Miqueias 4 consta do catálogo", () => {
  assert.match(catalog, /import \{ miqueias4Study \} from "\.\/miqueias-4-study";/);
  assert.match(catalog, /"biblia-miqueias-cap-4": miqueias4Study/);
});
