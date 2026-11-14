import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");
const bible = JSON.parse(readFileSync(new URL("../src/lib/bible-livre/salmos.json", import.meta.url), "utf8"));

for (let n = 137; n <= 146; n++) {
  test("Salmos " + n + " — estudo profundo, leitura integral, referências e integração", () => {
    const source = readFileSync(new URL("../src/lib/content/psalm-" + n + "-study.ts", import.meta.url), "utf8");
    const start = source.indexOf(" = {\n"), end = source.lastIndexOf(";\n");
    assert.ok(start >= 0 && end > start, "Expected static StudyContent object");
    const study = JSON.parse(source.slice(start + 3, end));
    const count = bible.chapters[String(n)]?.length;
    assert.ok(Number.isInteger(count), "Bible Livre chapter missing");
    assert.equal(study.version, 5);
    assert.equal(study.depth, "deep");
    assert.ok(study.intro.length >= 850);
    assert.ok(study.historicalContext.length >= 700);
    assert.ok(study.application.length >= 850);
    assert.ok(study.conclusion.length >= 500);
    assert.ok(study.keyPoints.length >= 8);
    assert.ok(study.questions.length >= 15);
    assert.ok(study.crossReferences.length >= 8);
    assert.ok(study.sections.length >= count + 8);
    assert.equal(new Set(study.sections.map(s => s.id)).size, study.sections.length);
    assert.equal(new Set(study.sections.map(s => s.title)).size, study.sections.length);
    assert.ok(study.sections.every(s => s.body.length >= 350));
    const reading = study.sections.find(s => s.id === "leitura-biblica");
    assert.ok(reading);
    assert.match(reading.body, /Paráfrase livre/);
    const markers = [...reading.body.matchAll(/\*\*(\d+)\.\*\*/g)].map(m => Number(m[1]));
    assert.deepEqual(markers, Array.from({length: count}, (_, i) => i + 1), "Every verse must appear exactly once");
    const exegesis = study.sections.filter(s => s.kind === "exegesis");
    for (let v = 1; v <= count; v++) {
      assert.ok(exegesis.some(s => s.scriptureRefs?.includes("Salmos " + n + ":" + v)), "Verse " + v + " has no exegesis");
    }
    for (const section of exegesis) {
      assert.equal(section.scriptureRefs.length, 1);
      const match = section.scriptureRefs[0].match(new RegExp("^Salmos " + n + ":(\\d+)$"));
      assert.ok(match, "Invalid verse ref for Psalm " + n);
      assert.ok(Number(match[1]) >= 1 && Number(match[1]) <= count);
      assert.ok(section.title.includes("Versículo " + match[1] + " —"), "Title/ref mismatch");
    }
    const numbering = study.sections.slice(1).map(s => Number(s.title.match(/^(\d+)\./)?.[1]));
    assert.deepEqual(numbering, Array.from({length: numbering.length}, (_, i) => i + 1));
    assert.match(catalog, new RegExp('import \\{ psalm' + n + 'Study \\} from "\\./psalm-' + n + '-study";'));
    assert.equal((catalog.match(new RegExp('"biblia-salmos-cap-' + n + '": psalm' + n + 'Study', "g")) ?? []).length, 1);
  });
}

test("Critical editorial distinctions are not silently removed", () => {
  const read = n => {
    const src = readFileSync(new URL("../src/lib/content/psalm-" + n + "-study.ts", import.meta.url), "utf8");
    return JSON.parse(src.slice(src.indexOf(" = {\n") + 3, src.lastIndexOf(";\n")));
  };
  const p137 = read(137), p139 = read(139), p141 = read(141), p145 = read(145), p146 = read(146);
  const all = s => [s.intro, s.historicalContext, s.application, ...s.sections.map(x => x.body)].join("\n").toLowerCase();
  assert.match(all(p137), /crianças/);
  assert.match(all(p139), /sheol/);
  assert.match(all(p139), /imprecaç/);
  assert.match(all(p141), /violência/);
  assert.match(all(p145), /acróstic/);
  assert.match(all(p145), /nun/);
  assert.match(all(p146), /órfãos/);
  assert.match(all(p146), /viúvas/);
  assert.equal(bible.chapters["145"].length, 21, "Do not invent missing alphabetic line in Psalm 145");
});
