import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = readFileSync(new URL("../src/lib/content/hebrews-11-study.ts", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");
const verses = JSON.parse(readFileSync(new URL("../src/lib/bible-livre/hebreus.json", import.meta.url), "utf8")).chapters["11"];
test("Hebrews 11 has full BLIVRE verse coverage and unique sections", () => {
  assert.equal(verses.length, 40);
  for (let i = 1; i <= 40; i++) {
    assert.match(source, new RegExp('\\*\\*' + i + '\\.\\*\\*'));
    assert.match(source, new RegExp('versiculo-' + i + '"'));
  }
  const ids = [...source.matchAll(/"id": "([^"]+)"/g)].map(m => m[1]);
  assert.equal(ids.length, new Set(ids).size);
  assert.match(source, /Paráfrase livre original/);
  assert.equal((catalog.match(/"biblia-hebreus-cap-11": hebrews11Study/g) || []).length, 1);
});
