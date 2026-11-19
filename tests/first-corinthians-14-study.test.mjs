import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const study = readFileSync(new URL("../src/lib/content/first-corinthians-14-study.ts", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");
const livre = JSON.parse(readFileSync(new URL("../src/lib/bible-livre/1-corintios.json", import.meta.url), "utf8"));
test("1 Corinthians 14: 40 BLIVRE verses", () => {
  assert.equal(livre.chapters["14"].length, 40);
  for (let v=1; v<=40; v++) {
    assert.ok(study.includes('"id": "versiculo-' + v + '"'));
    assert.ok(study.includes('"1 Coríntios 14:' + v + '"'));
  }
});
test("editorial integrity", () => {
  assert.match(study, /paráfrase livre original/i);
  assert.equal(study.split("**Exposição contextual:**").length-1,40);
  for (const id of ["pericope-1-5","pericope-6-12","pericope-13-19","pericope-20-25","pericope-26-33","pericope-34-35","pericope-36-40","oficina-do-pregador","oracao-final","perguntas-com-respostas"]) assert.ok(study.includes('"id": "'+id+'"'));
});
test("catalog exactly once", () => {
  assert.equal((catalog.match(/"biblia-1-corintios-cap-14":/g)||[]).length,1);
  assert.equal((catalog.match(/import \\{ firstCorinthians14Study \\} from/g)||[]).length,1);
});
