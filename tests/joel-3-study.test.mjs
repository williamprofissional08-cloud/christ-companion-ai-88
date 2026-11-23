import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const study = readFileSync(new URL("../src/lib/content/joel-3-study.ts", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");
test("Joel 3 cobre 21 versículos e seções editoriais", () => {
  const ids = [...study.matchAll(/"id": "versiculo-(\d+)"/g)].map(m => Number(m[1]));
  assert.deepEqual(ids, Array.from({ length: 21 }, (_, i) => i + 1));
  for (const section of ["contexto", "debates", "cristo", "exercicios", "pregador", "oracao"])
    assert.ok(study.includes('"id": "' + section + '"'), section);
});
test("Joel 3 consta do catálogo", () => {
  assert.match(catalog, /import \{ joel3Study \} from "\.\/joel-3-study";/);
  assert.match(catalog, /"biblia-joel-cap-3": joel3Study/);
});
