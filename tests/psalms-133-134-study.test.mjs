import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");

for (const [chapter, count, themes] of [
  [133, 3, ["óleo", "arão", "hermom", "união"]],
  [134, 3, ["santuário", "noite", "sião", "criador"]],
]) {
  test("Salmos " + chapter + " — verso por verso e registro único", () => {
    const source = readFileSync(new URL("../src/lib/content/psalm-" + chapter + "-study.ts", import.meta.url), "utf8");
    const a = source.indexOf(" = {\n"), b = source.lastIndexOf(";\n");
    assert.ok(a >= 0 && b > a);
    const s = JSON.parse(source.slice(a + 3, b));
    assert.equal(s.version, 5);
    assert.equal(s.depth, "deep");
    assert.ok(s.intro.length >= 850);
    assert.ok(s.historicalContext.length >= 700);
    assert.ok(s.application.length >= 800);
    assert.ok(s.conclusion.length >= 500);
    assert.ok(s.keyPoints.length >= 8);
    assert.ok(s.questions.length >= 15);
    assert.ok(s.crossReferences.length >= 8);
    assert.ok(s.sections.length >= 12);
    assert.equal(new Set(s.sections.map(x => x.id)).size, s.sections.length);
    assert.equal(new Set(s.sections.map(x => x.title)).size, s.sections.length);
    assert.ok(s.sections.every(x => x.body.length >= 350));
    const reading = s.sections.find(x => x.id === "leitura-biblica");
    assert.match(reading.body, /Paráfrase livre/);
    for (let v = 1; v <= count; v++) assert.ok(reading.body.includes("**" + v + ".**"), "Missing verse " + v);
    const n = s.sections.slice(1).map(x => Number(x.title.match(/^(\d+)\./)?.[1]));
    assert.deepEqual(n, Array.from({length: n.length}, (_, i) => i + 1));
    const body = [s.intro, s.application, ...s.sections.map(x => x.body)].join(" ").toLowerCase();
    for (const theme of themes) assert.ok(body.includes(theme), "Missing theme " + theme);
    assert.equal((catalog.match(new RegExp('"biblia-salmos-cap-' + chapter + '": psalm' + chapter + 'Study', "g")) ?? []).length, 1);
    assert.match(catalog, new RegExp('import \\{ psalm' + chapter + 'Study \\} from "\\./psalm-' + chapter + '-study";'));
  });
}
