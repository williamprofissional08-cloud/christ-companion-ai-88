import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const study = readFileSync(new URL("../src/lib/content/john-2-study.ts", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");
test("João 2 cobre exatamente os 25 versículos com IDs únicos", () => {
  const ids = [...study.matchAll(/"id": "([^"]+)"/g)].map((match) => match[1]);
  assert.equal(ids.length, new Set(ids).size);
  const verses = ids.filter((id) => /^versiculo-\d+$/.test(id));
  assert.deepEqual(verses, Array.from({ length: 25 }, (_, i) => `versiculo-${i + 1}`));
  for (let n = 1; n <= 25; n++) assert.ok(study.includes(`"João 2:${n}"`));
  assert.equal((study.match(/Paráfrase explicativa livre original/g) ?? []).length, 25);
});
test("João 2 está registrado uma única vez", () => {
  assert.equal((catalog.match(/"biblia-joao-cap-2": john2Study/g) ?? []).length, 1);
  assert.equal((catalog.match(/import \{ john2Study \} from "\.\/john-2-study";/g) ?? []).length, 1);
});
