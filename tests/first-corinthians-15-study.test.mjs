import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const study = readFileSync(new URL("../src/lib/content/first-corinthians-15-study.ts", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");
const livre = JSON.parse(readFileSync(new URL("../src/lib/bible-livre/1-corintios.json", import.meta.url), "utf8"));
test("1 Corinthians 15: all 58 BLIVRE verses accounted for", () => {
  assert.equal(livre.chapters["15"].length, 58);
  for (let verse = 1; verse <= 58; verse++) {
    assert.match(study, new RegExp('"id": "versiculo-' + verse + '"'));
    assert.match(study, new RegExp('1 Coríntios 15:' + verse + '(?=[^0-9]|$)'));
  }
});
test("original paraphrase, pericope exegesis, prayer, preaching and applications", () => {
  assert.match(study, /paráfrase livre original/i);
  assert.equal((study.match(/\\n\\n\\*\\*Exposição contextual:/g) || []).length, 58);
  for (const id of ["pericope-1-11","pericope-12-19","pericope-20-28","pericope-29-34","pericope-35-49","pericope-50-57","pericope-58-58","oficina-do-pregador","oracao-final","perguntas-com-respostas"]) assert.ok(study.includes('"id": "' + id + '"'));
});
test("catalog registers study exactly once", () => {
  assert.equal((catalog.match(/"biblia-1-corintios-cap-15":/g)||[]).length, 1);
  assert.equal((catalog.match(/import \{ firstCorinthians15Study \} from/g)||[]).length, 1);
});
