import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const root = new URL("../", import.meta.url);
const source = readFileSync(new URL("src/lib/content/psalm-147-study.ts", root), "utf8");
const catalog = readFileSync(new URL("src/lib/content/curated-studies.ts", root), "utf8");
const bible = JSON.parse(readFileSync(new URL("src/lib/bible-livre/salmos.json", root), "utf8"));
const study = JSON.parse(source.slice(source.indexOf("= {") + 2, source.lastIndexOf(";")).trim());
test("Psalm 147 has complete paraphrase, exposition and catalog entry", () => {
  const count = bible.chapters["147"].length;
  assert.equal(count, 20);
  const reading = study.sections.find(s => s.id === "leitura-biblica");
  for (let i = 1; i <= count; i++) {
    assert.ok(reading.body.includes("**" + i + ".**"), "missing verse " + i);
    assert.ok(study.sections.some(s => s.id === "versiculo-" + i && s.scriptureRefs.includes("Salmos 147:" + i)));
  }
  assert.equal(study.sections.filter(s => s.id.startsWith("versiculo-")).length, count);
  assert.match(reading.body, /Paráfrase livre para estudo, não tradução oficial/);
  assert.ok(study.sections.some(s => s.title.includes("Oficina do pregador")));
  assert.ok(study.sections.some(s => s.title.includes("Exercícios com respostas orientadoras")));
  assert.equal(catalog.split('"biblia-salmos-cap-147":').length - 1, 1);
  assert.ok(catalog.includes('import { psalm147Study } from "./psalm-147-study";'));
});
