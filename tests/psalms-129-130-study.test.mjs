import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");

for (const [chapter, count, themes] of [
  [129, 8, ["israel", "opressão", "justiça", "telhado"]],
  [130, 8, ["perdão", "profundezas", "redenção", "espera"]],
]) {
  test("Salmos " + chapter + " — cobertura bíblica, qualidade e catálogo", () => {
    const source = readFileSync(new URL("../src/lib/content/psalm-" + chapter + "-study.ts", import.meta.url), "utf8");
    const start = source.indexOf(" = {\n");
    const end = source.lastIndexOf(";\n");
    assert.ok(start >= 0 && end > start);
    const s = JSON.parse(source.slice(start + 3, end));
    assert.equal(s.depth, "deep");
    assert.equal(s.version, 5);
    assert.ok(s.intro.length >= 850);
    assert.ok(s.historicalContext.length >= 700);
    assert.ok(s.application.length >= 850);
    assert.ok(s.conclusion.length >= 500);
    assert.ok(s.keyPoints.length >= 8);
    assert.ok(s.questions.length >= 15);
    assert.ok(s.crossReferences.length >= 7);
    assert.ok(s.sections.length >= 17);
    assert.equal(new Set(s.sections.map(x => x.id)).size, s.sections.length);
    assert.equal(new Set(s.sections.map(x => x.title)).size, s.sections.length);
    assert.ok(s.sections.every(x => x.body.length >= 350));
    const reading = s.sections.find(x => x.id === "leitura-biblica");
    assert.match(reading.body, /Paráfrase livre/);
    for (let v = 1; v <= count; v++) assert.ok(reading.body.includes("**" + v + ".**"), "missing verse " + v);
    const nums = s.sections.slice(1).map(x => Number(x.title.match(/^(\d+)\./)?.[1]));
    assert.deepEqual(nums, Array.from({length: nums.length}, (_, i) => i + 1));
    const text = [s.intro, s.application, ...s.sections.map(x => x.body)].join(" ").toLowerCase();
    for (const term of themes) assert.ok(text.includes(term), "topic missing " + term);
    assert.equal((catalog.match(new RegExp('"biblia-salmos-cap-' + chapter + '": psalm' + chapter + 'Study', "g")) ?? []).length, 1);
    assert.match(catalog, new RegExp('import \\{ psalm' + chapter + 'Study \\} from "\\./psalm-' + chapter + '-study";'));
  });
}
