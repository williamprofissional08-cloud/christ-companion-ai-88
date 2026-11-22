import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const root = new URL("../", import.meta.url);
const source = readFileSync(new URL("src/lib/content/romans-10-study.ts", root), "utf8");
const catalog = readFileSync(new URL("src/lib/content/curated-studies.ts", root), "utf8");
const bible = JSON.parse(readFileSync(new URL("src/lib/bible-livre/romanos.json", root), "utf8"));
test("Romanos 10 cobre os 21 versículos BLIVRE em leitura e exposição", () => {
  const count = bible.chapters["10"].length;
  assert.equal(count, 21);
  for (let verse = 1; verse <= count; verse++) {
    assert.match(source, new RegExp("\\\\*\\\\*" + verse + "\\\\*\\\\* "));
    assert.match(source, new RegExp('"id": "exegese-verso-' + verse + '"'));
    assert.match(source, new RegExp('"Romanos 10:' + verse + '"'));
  }
  assert.equal((source.match(/"id": "exegese-verso-\\d+"/g) || []).length, count);
});
test("Romanos 10 inclui perícope, referências, oração e alertas editoriais", () => {
  for (const term of ["pericope-1", "pericope-5", "interpretacao-e-inferencia", "referencias-cruzadas", "perguntas-com-respostas", "oficina-do-pregador", "oracao-final", "Deuteronômio 32:21", "antissemitismo", "não é tradução oficial"]) assert.ok(source.includes(term), term);
});
test("catálogo registra uma única vez o slug e import de Romanos 10", () => {
  assert.equal((catalog.match(/"biblia-romanos-cap-10":/g) || []).length, 1);
  assert.equal((catalog.match(/import \\{ romans10Study \\} from "\\.\\/romans-10-study";/g) || []).length, 1);
});
