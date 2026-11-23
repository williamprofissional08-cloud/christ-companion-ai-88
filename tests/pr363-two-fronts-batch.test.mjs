import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const catalogue = readFileSync("src/lib/content/curated-studies.ts", "utf8");

function loadStudy(file, exportedName) {
  const src = readFileSync(file, "utf8");
  const match = src.match(new RegExp("export const " + exportedName + ": StudyContent = ([\\s\\S]*);\\s*$"));
  assert.ok(match, "Missing structured StudyContent export in " + file);
  return JSON.parse(match[1]);
}

for (const item of [
  { book: "mateus", chapter: 18, verseCount: 35, file: "src/lib/content/matthew-18-study.ts", name: "matthew18Study", slug: "biblia-mateus-cap-18" },
  { book: "1-pedro", chapter: 1, verseCount: 25, file: "src/lib/content/first-peter-1-study.ts", name: "firstPeter1Study", slug: "biblia-1-pedro-cap-1" },
]) {
  test(item.book + " " + item.chapter + ": each Bible verse has original reading and exposition", () => {
    const bible = JSON.parse(readFileSync("src/lib/bible-livre/" + item.book + ".json", "utf8"));
    assert.equal(bible.chapters[item.chapter].length, item.verseCount);
    const study = loadStudy(item.file, item.name);
    assert.equal(study.version, 5);
    assert.equal(study.depth, "deep");
    const reading = study.sections.find((section) => section.id === "leitura-integral");
    assert.ok(reading);
    assert.match(reading.body, /paráfrase/i);
    const numbers = [...reading.body.matchAll(/\*\*(\d+)\.\*\*/g)].map((entry) => Number(entry[1]));
    assert.deepEqual(numbers, Array.from({ length: item.verseCount }, (_, index) => index + 1));
    for (let verse = 1; verse <= item.verseCount; verse++) {
      const section = study.sections.find((s) => s.id === "versiculo-" + verse);
      assert.ok(section, "Missing verse exposition " + verse);
      assert.ok(section.scriptureRefs.includes((item.book === "mateus" ? "Mateus" : "1 Pedro") + " " + item.chapter + ":" + verse));
      assert.ok(section.body.length >= 180, "Verse exposition too short: " + verse);
    }
    assert.equal(new Set(study.sections.map((s) => s.id)).size, study.sections.length);
  });

  test(item.book + " " + item.chapter + ": deep sections and unique catalogue entry", () => {
    const study = loadStudy(item.file, item.name);
    assert.ok(study.sections.length >= 35);
    assert.ok(study.keyPoints.length >= 8);
    assert.ok(study.crossReferences.length >= 12);
    assert.ok(study.questions.length >= 15);
    assert.ok(study.application.length >= 900);
    assert.ok(study.intro.length >= 900);
    assert.ok(study.historicalContext.length >= 900);
    assert.ok(study.sections.some((s) => s.id === "oficina" || s.id === "pregador"));
    const lines = catalogue.split("\n").filter((line) => line.includes('"' + item.slug + '":'));
    assert.equal(lines.length, 1, "The canonical study slug must appear exactly once");
    assert.match(lines[0], new RegExp(": " + item.name + ","));
  });
}

test("Matthew 18 warns about self-harm, abuse concealment and forced reconciliation", () => {
  const s = loadStudy("src/lib/content/matthew-18-study.ts", "matthew18Study");
  const all = s.sections.map((v) => v.body).join(" ");
  assert.match(all, /automutilação|autolesão/);
  assert.match(all, /denúncia|abuso/);
  assert.match(all, /reconciliação forçada/);
});

test("1 Peter 1 does not promise prosperity or equate suffering with moral failure", () => {
  const s = loadStudy("src/lib/content/first-peter-1-study.ts", "firstPeter1Study");
  const all = s.sections.map((v) => v.body).join(" ");
  assert.match(all, /riqueza|prosperidade/);
  assert.match(all, /tristeza|sofrimento/);
});
