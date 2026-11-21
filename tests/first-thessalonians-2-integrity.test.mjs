import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
const study = readFileSync(new URL("../src/lib/content/first-thessalonians-2-study.ts", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");
const bible = JSON.parse(readFileSync(new URL("../src/lib/bible-livre/1-tessalonicenses.json", import.meta.url), "utf8"));
test("1 Tessalonicenses 2: fonte, cobertura, IDs e registro único", () => {
  assert.equal(bible.chapters["2"].length, 20);
  assert.match(study, /Paráfrase livre original/);
  for (let v = 1; v <= 20; v++) {
    assert.match(study, new RegExp('versiculo-' + v + '"'));
    assert.match(study, new RegExp('1 Tessalonicenses 2:' + v + '"'));
    assert.match(study, new RegExp('\\*\\*' + v + '\\.\\*\\*'));
  }
  const ids = [...study.matchAll(/"id": "([^"]+)"/g)].map(m => m[1]);
  assert.equal(ids.length, new Set(ids).size);
  assert.ok(ids.length >= 26);
  assert.equal((catalog.match(/"biblia-1-tessalonicenses-cap-2"\s*:/g) || []).length, 1);
  assert.equal((catalog.match(/import \{ firstThessalonians2Study \} from "\.\/first-thessalonians-2-study";/g) || []).length, 1);
});
