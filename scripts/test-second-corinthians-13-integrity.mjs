import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
const study = readFileSync("src/lib/content/second-corinthians-13-study.ts", "utf8");
const catalog = readFileSync("src/lib/content/curated-studies.ts", "utf8");
const bible = JSON.parse(readFileSync("src/lib/bible-livre/2-corintios.json", "utf8"));
const count = bible.chapters["13"].length;
assert.equal(count, 14, "unexpected verse count");
const scripture = study.split('"id": "leitura-integral"')[1]?.split('"id": "contexto-historico"')[0];
assert.ok(scripture, "missing full reading");
for (let n = 1; n <= count; n++) {
  assert.ok(study.includes('"id": "versiculo-' + n + '"'), "missing exposition " + n);
  assert.ok(scripture.includes("**" + n + ".**"), "missing paraphrase " + n);
}
const ids = [...study.matchAll(/"id": "([^"]+)"/g)].map(m => m[1]);
assert.equal(ids.length, new Set(ids).size, "duplicate section IDs");
assert.equal((catalog.match(/"biblia-2-corintios-cap-13":/g) || []).length, 1, "duplicate slug");
assert.equal(catalog.split('import { secondCorinthians13Study } from "./second-corinthians-13-study";').length - 1, 1, "missing or duplicate import");
assert.ok(study.includes("Paráfrase livre original"));
console.log("2 Coríntios 13: integrity checks passed");
