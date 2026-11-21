import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");

for (const [chapter, count, minimumSections, themes] of [
  [131, 3, 12, ["humildade", "criança", "israel"]],
  [132, 18, 27, ["davi", "arca", "sião", "pão", "cristo"]],
]) {
  test("Salmos " + chapter + " — todos os versículos e coerência editorial", () => {
    const file = readFileSync(new URL("../src/lib/content/psalm-" + chapter + "-study.ts", import.meta.url), "utf8");
    const a = file.indexOf(" = {\n"), b = file.lastIndexOf(";\n");
    assert.ok(a >= 0 && b > a);
    const s = JSON.parse(file.slice(a + 3, b));
    assert.equal(s.version, 5);
    assert.equal(s.depth, "deep");
    assert.ok(s.intro.length >= 850);
    assert.ok(s.historicalContext.length >= 700);
    assert.ok(s.application.length >= 800);
    assert.ok(s.conclusion.length >= 500);
    assert.ok(s.keyPoints.length >= 8);
    assert.ok(s.questions.length >= 15);
    assert.ok(s.crossReferences.length >= 8);
    assert.ok(s.sections.length >= minimumSections);
    assert.equal(new Set(s.sections.map(x => x.id)).size, s.sections.length);
    assert.equal(new Set(s.sections.map(x => x.title)).size, s.sections.length);
    assert.ok(s.sections.every(x => x.body.length >= 350));
    const reading = s.sections.find(x => x.id === "leitura-biblica");
    assert.match(reading.body, /Paráfrase livre/);
    for (let v = 1; v <= count; v++) assert.ok(reading.body.includes("**" + v + ".**"), "Missing verse " + v);
    const titles = s.sections.slice(1).map(x => Number(x.title.match(/^(\d+)\./)?.[1]));
    assert.deepEqual(titles, Array.from({length: titles.length}, (_, i) => i + 1));
    const full = [s.intro, s.application, ...s.sections.map(x => x.body)].join(" ").toLowerCase();
    for (const theme of themes) assert.ok(full.includes(theme), "Missing theme " + theme);
    assert.equal((catalog.match(new RegExp('"biblia-salmos-cap-' + chapter + '": psalm' + chapter + 'Study', "g")) ?? []).length, 1);
    assert.match(catalog, new RegExp('import \\{ psalm' + chapter + 'Study \\} from "\\./psalm-' + chapter + '-study";'));
  });
}
