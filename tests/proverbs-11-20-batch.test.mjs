import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");
const bible = JSON.parse(readFileSync(new URL("../src/lib/bible-livre/proverbios.json", import.meta.url), "utf8"));
const chapters = [11, 12];
for (const n of chapters) {
  test("Provérbios " + n + ": paráfrase, exegese, recursos e catálogo", () => {
    const source = readFileSync(new URL("../src/lib/content/proverbs-" + n + "-study.ts", import.meta.url), "utf8");
    const start = source.indexOf(" = {\n"), end = source.lastIndexOf(";\n");
    assert.ok(start >= 0 && end > start);
    const s = JSON.parse(source.slice(start + 3, end));
    const verses = bible.chapters[String(n)].length;
    assert.equal(s.version, 5);
    assert.equal(s.depth, "deep");
    assert.ok(s.intro.length >= 800);
    assert.ok(s.historicalContext.length >= 650);
    assert.ok(s.application.length >= 750);
    assert.ok(s.keyPoints.length >= 8);
    assert.ok(s.crossReferences.length >= 8);
    assert.ok(s.questions.length >= 15);
    assert.ok(s.sections.length >= verses + 6);
    const reading = s.sections.find(x => x.id === "leitura-biblica");
    assert.match(reading.body, /Paráfrase livre/);
    const nums = [...reading.body.matchAll(/\*\*(\d+)\.\*\*/g)].map(x => +x[1]);
    assert.deepEqual(nums, Array.from({length: verses}, (_, i) => i + 1));
    for (let v = 1; v <= verses; v++) {
      assert.ok(s.sections.some(x => x.id === "versiculo-" + v && x.scriptureRefs.includes("Provérbios " + n + ":" + v)), "Missing Proverbs " + n + ":" + v);
    }
    assert.equal(new Set(s.sections.map(x => x.id)).size, s.sections.length);
    assert.equal(new Set(s.sections.map(x => x.title)).size, s.sections.length);
    assert.ok(s.sections.slice(1).every((x, i) => x.title.startsWith((i + 1) + ". ")));
    assert.equal((catalog.match(new RegExp('"biblia-proverbios-cap-' + n + '": proverbs' + n + 'Study', "g")) ?? []).length, 1);
    assert.match(catalog, new RegExp('import \\{ proverbs' + n + 'Study \\} from "\\./proverbs-' + n + '-study";'));
  });
}
