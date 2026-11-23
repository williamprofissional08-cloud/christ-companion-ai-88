import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const study = readFileSync(new URL("../src/lib/content/hosea-9-study.ts", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");

test("Oseias 9 cobre 17 versículos e seções editoriais", () => {
  const ids = [...study.matchAll(/"id": "versiculo-(\d+)"/g)].map((m) => Number(m[1]));
  assert.deepEqual(ids, Array.from({ length: 17 }, (_, i) => i + 1));
  for (const section of ["contexto", "debates", "cristo", "exercicios", "pregador", "oracao"]) {
    assert.ok(study.includes('"id": "' + section + '"'), section);
  }
});
test("Oseias 9 consta do catálogo", () => {
  assert.match(catalog, /import \{ hosea9Study \} from "\.\/hosea-9-study";/);
  assert.match(catalog, /"biblia-oseias-cap-9": hosea9Study/);
});
