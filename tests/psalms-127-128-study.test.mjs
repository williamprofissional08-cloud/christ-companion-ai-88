import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");

for (const [chapter, verseCount, themes] of [
  [127, 5, ["casa", "cidade", "sono", "filhos"]],
  [128, 6, ["sião", "trabalho", "paz", "oliveira"]],
]) {
  test("Salmos " + chapter + " — texto integral, estudo profundo e catálogo", () => {
    const source = readFileSync(new URL("../src/lib/content/psalm-" + chapter + "-study.ts", import.meta.url), "utf8");
    const start = source.indexOf(" = {\n");
    const end = source.lastIndexOf(";\n");
    assert.ok(start >= 0 && end > start, "Study object must be present");
    const study = JSON.parse(source.slice(start + 3, end));
    assert.equal(study.depth, "deep");
    assert.equal(study.version, 5);
    assert.ok(study.intro.length >= 850);
    assert.ok(study.historicalContext.length >= 700);
    assert.ok(study.application.length >= 700);
    assert.ok(study.keyPoints.length >= 8);
    assert.ok(study.questions.length >= 15);
    assert.ok(study.crossReferences.length >= 7);
    assert.ok(study.sections.length >= 12);
    const ids = study.sections.map(s => s.id);
    const titles = study.sections.map(s => s.title);
    assert.equal(new Set(ids).size, ids.length);
    assert.equal(new Set(titles).size, titles.length);
    assert.ok(study.sections.every(s => s.body.length >= 350));
    const reading = study.sections.find(s => s.id === "leitura-biblica");
    assert.ok(reading);
    assert.match(reading.body, /Paráfrase livre/);
    for (let v = 1; v <= verseCount; v++) assert.ok(reading.body.includes("**" + v + ".**"), "Missing verse " + v);
    const nums = study.sections.slice(1).map(s => Number(s.title.match(/^(\d+)\./)?.[1]));
    assert.deepEqual(nums, Array.from({length: nums.length}, (_, i) => i + 1));
    const full = [study.intro, study.historicalContext, ...study.sections.map(s => s.body)].join("\n").toLowerCase();
    for (const theme of themes) assert.ok(full.includes(theme), "Missing theme " + theme);
    assert.equal((catalog.match(new RegExp('"biblia-salmos-cap-' + chapter + '": psalm' + chapter + 'Study', "g")) ?? []).length, 1);
    assert.match(catalog, new RegExp('import \\{ psalm' + chapter + 'Study \\} from "\\./psalm-' + chapter + '-study";'));
  });
}
