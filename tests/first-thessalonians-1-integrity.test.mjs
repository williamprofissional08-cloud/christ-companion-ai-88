import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const study = readFileSync(new URL("../src/lib/content/first-thessalonians-1-study.ts", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");
test("1 Tessalonicenses 1 cobre dez versículos e preserva IDs únicos", () => {
  for (let verse = 1; verse <= 10; verse++) {
    assert.match(study, new RegExp('id": "versiculo-' + verse + '"'));
    assert.match(study, new RegExp('1 Tessalonicenses 1:' + verse + '"'));
  }
  const ids = [...study.matchAll(/"id": "([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.length >= 20);
  assert.match(study, /Paráfrase livre original/);
  for (const required of ["pericope-1", "pericope-2", "pericope-3", "exercicios", "pregador", "oracao"]) assert.ok(ids.includes(required));
});
test("1 Tessalonicenses 1 aparece uma única vez no catálogo", () => {
  assert.equal((catalog.match(/"biblia-1-tessalonicenses-cap-1":/g) || []).length, 1);
  assert.equal((catalog.match(/import \{ firstThessalonians1Study \}/g) || []).length, 1);
});
