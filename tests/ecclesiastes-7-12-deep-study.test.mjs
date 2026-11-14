import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");
const bible = JSON.parse(readFileSync(new URL("../src/lib/bible-livre/eclesiastes.json", import.meta.url), "utf8"));
const parse = n => {
  const src = readFileSync(new URL("../src/lib/content/ecclesiastes-" + n + "-study.ts", import.meta.url), "utf8");
  const start = src.indexOf(" = {\n"), end = src.lastIndexOf(";\n");
  assert.ok(start >= 0 && end > start, "Static study object not found");
  return JSON.parse(src.slice(start + 3, end));
};

for (let chapter = 7; chapter <= 12; chapter++) {
  test("Eclesiastes " + chapter + " — todos os versículos, catálogo e profundidade", () => {
    const study = parse(chapter);
    const count = bible.chapters[String(chapter)]?.length;
    assert.ok(Number.isInteger(count));
    assert.equal(study.version, 5);
    assert.equal(study.depth, "deep");
    assert.ok(study.intro.length >= 700);
    assert.ok(study.historicalContext.length >= 600);
    assert.ok(study.application.length >= 600);
    assert.ok(study.conclusion.length >= 450);
    assert.ok(study.keyPoints.length >= 8);
    assert.ok(study.crossReferences.length >= 7);
    assert.ok(study.questions.length >= 12);
    assert.ok(study.sections.length >= count + 9);
    assert.equal(new Set(study.sections.map(s => s.id)).size, study.sections.length);
    assert.equal(new Set(study.sections.map(s => s.title)).size, study.sections.length);
    const reading = study.sections.find(s => s.id === "leitura-biblica");
    assert.ok(reading);
    assert.match(reading.body, /Paráfrase livre/);
    const labels = [...reading.body.matchAll(/\*\*(\d+)\.\*\*/g)].map(m => Number(m[1]));
    assert.deepEqual(labels, Array.from({length:count}, (_,i) => i + 1));
    for (let verse=1; verse<=count; verse++) {
      const exegeses = study.sections.filter(s => s.id === "versiculo-" + verse);
      assert.equal(exegeses.length, 1, "One commentary for verse " + verse);
      assert.ok(exegeses[0].body.length >= 500, "Verse commentary too shallow: " + verse);
      assert.ok(exegeses[0].scriptureRefs.includes("Eclesiastes " + chapter + ":" + verse), "Verse citation mismatched");
    }
    const importLine = 'import { ecclesiastes' + chapter + 'Study } from "./ecclesiastes-' + chapter + '-study";';
    assert.equal(catalog.split(importLine).length, 2, "Exactly one import");
    const key = '"biblia-eclesiastes-cap-' + chapter + '": ecclesiastes' + chapter + 'Study';
    assert.equal(catalog.split(key).length, 2, "Exactly one catalog registration");
  });
}

test("Precauções interpretativas essenciais dos capítulos 7–12", () => {
  const all = n => {
    const st = parse(n);
    return [st.intro, st.historicalContext, st.application, ...st.sections.map(s => s.body)].join(" ").toLowerCase();
  };
  assert.match(all(7), /mulheres/);
  assert.match(all(7), /justo demais/);
  assert.match(all(8), /injustiça/);
  assert.match(all(8), /autoridade/);
  assert.match(all(9), /sheol/);
  assert.match(all(9), /pobre sábio/);
  assert.match(all(10), /machado/);
  assert.match(all(10), /governantes/);
  assert.match(all(11), /pão sobre as águas/);
  assert.match(all(11), /juventude/);
  assert.match(all(12), /envelhec/);
  assert.match(all(12), /epílogo/);
  assert.equal(bible.chapters["7"].length, 29);
  assert.equal(bible.chapters["12"].length, 14);
});
