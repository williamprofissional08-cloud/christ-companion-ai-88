import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const study = readFileSync(new URL("../src/lib/content/first-thessalonians-5-study.ts", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");
const bible = JSON.parse(readFileSync(new URL("../src/lib/bible-livre/1-tessalonicenses.json", import.meta.url), "utf8"));
test("1 Tessalonicenses 5: 28 versículos com paráfrase e exposição", () => {
  assert.equal(bible.chapters["5"].length,28);
  for (let n=1;n<=28;n++) {
    assert.ok(study.includes("**"+n+".**"), "paráfrase "+n);
    assert.ok(study.includes('"id": "versiculo-'+n+'"'), "seção "+n);
    assert.ok(study.includes('1 Tessalonicenses 5:'+n+'"'), "referência "+n);
  }
  assert.ok(study.includes("Paráfrase livre original"));
});
test("1 Tessalonicenses 5: catálogo único", () => {
  assert.equal(catalog.split('"biblia-1-tessalonicenses-cap-5":').length-1,1);
  assert.equal(catalog.split('import { firstThessalonians5Study }').length-1,1);
});
test("1 Tessalonicenses 5: seções essenciais", () => {
  for (const id of ["pericope-dia","pericope-luz","pericope-comunidade","pericope-discernimento","pericope-bencao","exercicios","pregador","oracao"]) assert.ok(study.includes('"'+id+'"'));
});
