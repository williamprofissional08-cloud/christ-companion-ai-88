import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const study = readFileSync(new URL("../src/lib/content/hosea-3-study.ts", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");

test("Oseias 3 cobre cinco versículos e mínimo editorial de seções", () => {
  const ids = [...study.matchAll(/"id": "versiculo-(\d+)"/g)].map((m) => Number(m[1]));
  assert.deepEqual(ids, [1, 2, 3, 4, 5]);
  const sectionIds = [...study.matchAll(/"id": "[^"]+"/g)];
  assert.ok(sectionIds.length >= 18, "mínimo de 18 seções");
  for (const section of ["contexto", "debates", "cristo", "exercicios", "pregador", "oracao"]) {
    assert.ok(study.includes('"id": "' + section + '"'), section);
  }
});
test("Oseias 3 consta do catálogo", () => {
  assert.match(catalog, /import \{ hosea3Study \} from "\.\/hosea-3-study";/);
  assert.match(catalog, /"biblia-oseias-cap-3": hosea3Study/);
});
