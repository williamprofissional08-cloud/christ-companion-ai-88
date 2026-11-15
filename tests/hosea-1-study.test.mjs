import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const study = readFileSync(new URL("../src/lib/content/hosea-1-study.ts", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");

test("Oseias 1 cobre 11 versículos e seções editoriais", () => {
  const ids = [...study.matchAll(/"id": "versiculo-(\d+)"/g)].map((m) => Number(m[1]));
  assert.deepEqual(ids, Array.from({ length: 11 }, (_, i) => i + 1));
  for (const section of ["contexto", "debates", "cristo", "exercicios", "pregador", "oracao"]) {
    assert.ok(study.includes('"id": "' + section + '"'), section);
  }
});
test("Oseias 1 consta do catálogo", () => {
  assert.match(catalog, /import \{ hosea1Study \} from "\.\/hosea-1-study";/);
  assert.match(catalog, /"biblia-oseias-cap-1": hosea1Study/);
});
