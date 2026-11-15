import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const source = readFileSync(new URL("src/lib/content/daniel-8-study.ts", root), "utf8");
const catalog = readFileSync(new URL("src/lib/content/curated-studies.ts", root), "utf8");
const bible = JSON.parse(readFileSync(new URL("src/lib/bible-livre/daniel.json", root), "utf8"));

test("Daniel 8 tem estudo profundo integrado e todos os versículos", () => {
  const match = source.match(/export const daniel8Study: StudyContent = ([\\s\\S]*);\\s*$/);
  assert.ok(match, "exportação StudyContent ausente");
  const study = JSON.parse(match[1]);
  assert.equal(study.depth, "deep");
  assert.equal(bible.chapters["8"].length, 27);
  const verses = study.sections.filter((section) => /^versiculo-\\d+$/.test(section.id));
  assert.equal(verses.length, bible.chapters["8"].length);
  assert.equal(new Set(study.sections.map((section) => section.id)).size, study.sections.length);
  for (let i = 1; i <= 27; i++) {
    const verse = verses.find((section) => section.id === `versiculo-${i}`);
    assert.ok(verse, `versículo ${i} ausente`);
    assert.match(verse.body, /Paráfrase livre autoral/);
    assert.match(verse.body, /Exegese/);
    assert.ok(verse.body.length > 130);
  }
  assert.match(catalog, /import \\{ daniel8Study \\} from "\\.\\/daniel-8-study"/);
  assert.match(catalog, /"biblia-daniel-cap-8": daniel8Study/);
});
