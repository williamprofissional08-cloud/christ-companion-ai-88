import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const study = readFileSync(new URL("../src/lib/content/obadias-1-study.ts", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");
test("Obadias 1 cobre os 21 versículos e seções editoriais", () => {
  const ids = [...study.matchAll(/"id": "versiculo-(\d+)"/g)].map(m => Number(m[1]));
  assert.deepEqual(ids, Array.from({ length: 21 }, (_, i) => i + 1));
  for (const section of ["contexto", "debates", "cristo", "exercicios", "pregador", "oracao"])
    assert.ok(study.includes('"id": "' + section + '"'), section);
});
test("Obadias 1 consta do catálogo", () => {
  assert.match(catalog, /import \{ obadias1Study \} from "\.\/obadias-1-study";/);
  assert.match(catalog, /"biblia-obadias-cap-1": obadias1Study/);
});
