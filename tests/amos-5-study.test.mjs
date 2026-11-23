import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const study = readFileSync(new URL("../src/lib/content/amos-5-study.ts", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");
test("Amós 5 cobre 27 versículos e seções editoriais", () => {
  const ids = [...study.matchAll(/"id": "versiculo-(\d+)"/g)].map(m => Number(m[1]));
  assert.deepEqual(ids, Array.from({ length: 27 }, (_, i) => i + 1));
  for (const section of ["contexto", "debates", "cristo", "exercicios", "pregador", "oracao"])
    assert.ok(study.includes('"id": "' + section + '"'), section);
});
test("Amós 5 consta do catálogo", () => {
  assert.match(catalog, /import \{ amos5Study \} from "\.\/amos-5-study";/);
  assert.match(catalog, /"biblia-amos-cap-5": amos5Study/);
});
