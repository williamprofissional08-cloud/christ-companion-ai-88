import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const study = readFileSync(new URL("../src/lib/content/daniel-9-study.ts", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");

test("Daniel 9 cobre os 27 versículos sem IDs duplicados", () => {
  const ids = [...study.matchAll(/"id": "versiculo-(\d+)"/g)].map((m) => Number(m[1]));
  assert.deepEqual(ids, Array.from({ length: 27 }, (_, i) => i + 1));
  assert.match(study, /"depth": "deep"/);
  assert.match(study, /"id": "debates"/);
  assert.match(study, /"id": "pregador"/);
});
test("Daniel 9 está registrado no catálogo", () => {
  assert.match(catalog, /import \{ daniel9Study \} from "\.\/daniel-9-study";/);
  assert.match(catalog, /"biblia-daniel-cap-9": daniel9Study/);
});
