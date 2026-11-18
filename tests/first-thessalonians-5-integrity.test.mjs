import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const study = readFileSync(new URL("../src/lib/content/first-thessalonians-5-study.ts", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");
const bible = JSON.parse(readFileSync(new URL("../src/lib/bible-livre/1-tessalonicenses.json", import.meta.url), "utf8"));
test("1 Tessalonicenses 5: contagem BLIVRE e paráfrase integral", () => {
  const count = bible.chapters["5"].length;
  assert.equal(count, 28);
  for (let n=1;n<=count;n++) {
    assert.match(study, new RegExp("\\*\\*"+n+"\\.\\*\\*"));
    assert.match(study, new RegExp('versiculo-'+n+''));
    assert.match(study, new RegExp('1 Tessalonicenses 5:'+n+'["\\\\]'));
  }
  assert.match(study, /Paráfrase livre original/);
});
test("1 Tessalonicenses 5: catálogo sem duplicação", () => {
  assert.equal((catalog.match(/"biblia-1-tessalonicenses-cap-5"\\s*:/g)||[]).length,1);
  assert.equal((catalog.match(/import \\{ firstThessalonians5Study \\}/g)||[]).length,1);
});
test("1 Tessalonicenses 5: estrutura pastoral", () => {
  for(const id of ["pericope-dia","pericope-luz","pericope-comunidade","pericope-discernimento","pericope-bencao","exercicios","pregador","oracao"]) assert.ok(study.includes('"'+id+'"'));
});
