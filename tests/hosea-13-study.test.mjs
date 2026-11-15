import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const study = readFileSync(new URL("../src/lib/content/hosea-13-study.ts", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");
test("Oseias 13 cobre 16 versículos e seções editoriais", () => {
  const ids = [...study.matchAll(/"id": "versiculo-(\d+)"/g)].map(m => Number(m[1]));
  assert.deepEqual(ids, Array.from({ length: 16 }, (_, i) => i + 1));
  for (const section of ["contexto", "debates", "cristo", "exercicios", "pregador", "oracao"])
    assert.ok(study.includes('"id": "' + section + '"'), section);
});
test("Oseias 13 consta do catálogo", () => {
  assert.match(catalog, /import \{ hosea13Study \} from "\.\/hosea-13-study";/);
  assert.match(catalog, /"biblia-oseias-cap-13": hosea13Study/);
});
