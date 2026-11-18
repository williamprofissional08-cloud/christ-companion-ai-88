import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = readFileSync("src/lib/content/1-thessalonians-3-study.ts", "utf8");
const catalog = readFileSync("src/lib/content/curated-studies.ts", "utf8");
test("1 Tessalonicenses 3: leitura completa e seções estáveis", () => {
  for (let verse=1; verse<=13; verse++) {
    assert.match(source, new RegExp('\\*\\*'+verse+'\\.\\*\\*'));
    assert.match(source, new RegExp('"id": "versiculo-'+verse+'"'));
  }
  const ids = [...source.matchAll(/"id": "([^"]+)"/g)].map(x=>x[1]);
  assert.equal(ids.length, new Set(ids).size);
  assert.ok(ids.length>=26);
});
test("1 Tessalonicenses 3: catálogo único", () => {
  assert.equal(catalog.split('biblia-1-tessalonicenses-cap-3').length-1, 1);
  assert.equal(catalog.split('import { firstThessalonians3Study }').length-1, 1);
});
