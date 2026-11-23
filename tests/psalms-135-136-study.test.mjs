import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");
for (const [chapter, verses, required] of [
  [135, 21, ["egito", "seom", "ogue", "ídolos", "compaixão"]],
  [136, 26, ["refrão", "faraó", "seom", "ogue", "alimento"]],
]) {
  test("Salmos " + chapter + " — cobertura integral, hermenêutica e integração", () => {
    const source = readFileSync(new URL("../src/lib/content/psalm-" + chapter + "-study.ts", import.meta.url), "utf8");
    const start = source.indexOf(" = {\n"), end = source.lastIndexOf(";\n");
    assert.ok(start >= 0 && end > start, "Missing study JSON object");
    const s = JSON.parse(source.slice(start + 3, end));
    assert.equal(s.version, 5);
    assert.equal(s.depth, "deep");
    assert.ok(s.intro.length >= 850);
    assert.ok(s.historicalContext.length >= 800);
    assert.ok(s.application.length >= 850);
    assert.ok(s.conclusion.length >= 650);
    assert.ok(s.keyPoints.length >= 9);
    assert.ok(s.questions.length >= 18);
    assert.ok(s.crossReferences.length >= 12);
    assert.ok(s.sections.length >= verses + 10);
    assert.equal(new Set(s.sections.map(x => x.id)).size, s.sections.length, "Duplicate section ids");
    assert.equal(new Set(s.sections.map(x => x.title)).size, s.sections.length, "Duplicate section titles");
    assert.ok(s.sections.every(x => x.body.length >= 350), "Insufficient section depth");
    const first = s.sections.find(x => x.id === "leitura-biblica");
    assert.match(first.body, /Paráfrase livre/);
    for (let v = 1; v <= verses; v++) {
      assert.ok(first.body.includes("**" + v + ".**"), "Missing verse " + v);
      assert.ok(s.sections.some(x => x.id === "versiculo-" + v && x.scriptureRefs.includes("Salmos " + chapter + ":" + v)), "Missing exegesis for verse " + v);
    }
    if (chapter === 136) assert.equal((first.body.match(/Seu amor fiel permanece para sempre\./g) ?? []).length, 26);
    const nums = s.sections.slice(1).map(x => Number(x.title.match(/^(\d+)\./)?.[1]));
    assert.deepEqual(nums, Array.from({length: nums.length}, (_, i) => i + 1), "Non-sequential section numbering");
    const full = [s.intro, s.historicalContext, s.application, ...s.sections.map(x => x.body)].join(" ").toLowerCase();
    for (const theme of required) assert.ok(full.includes(theme), "Missing central theme " + theme);
    assert.equal((catalog.match(new RegExp('"biblia-salmos-cap-' + chapter + '": psalm' + chapter + 'Study', "g")) ?? []).length, 1, "Catalog entry should be unique");
    assert.match(catalog, new RegExp('import \\{ psalm' + chapter + 'Study \\} from "\\./psalm-' + chapter + '-study";'));
  });
}
