import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const ROOT = process.cwd();
const source = readFileSync(ROOT + "/src/lib/content/matthew-17-study.ts", "utf8");
const catalogue = readFileSync(ROOT + "/src/lib/content/curated-studies.ts", "utf8");
const bible = JSON.parse(readFileSync(ROOT + "/src/lib/bible-livre/mateus.json", "utf8"));
const match = source.match(/export const matthew17Study: StudyContent = ([\\s\\S]*);\\s*$/);
assert.ok(match, "Mateus 17 deve exportar conteúdo estruturado");
const study = JSON.parse(match[1]);

test("Mateus 17: leitura e exposição cobrem os 27 versículos BLIVRE", () => {
  const verses = bible.chapters[17];
  assert.equal(verses.length, 27);
  const reading = study.sections.find((s) => s.id === "leitura-integral");
  assert.ok(reading, "Leitura integral obrigatória");
  assert.match(reading.body, /paráfrase própria/i);
  const indices = [...reading.body.matchAll(/\\*\\*(\\d+)\\.\\*\\*/g)].map((m) => Number(m[1]));
  assert.deepEqual(indices, Array.from({ length: verses.length }, (_, i) => i + 1));
  for (let n = 1; n <= verses.length; n++) {
    const section = study.sections.find((s) => s.id === `versiculo-${n}`);
    assert.ok(section, `Falta exposição do versículo ${n}`);
    assert.ok(section.scriptureRefs.includes(`Mateus 17:${n}`));
    assert.ok(section.body.includes("Exposição:"));
    assert.ok(section.body.length >= 260);
  }
});

test("Mateus 17: conteúdo curado profundo, identificadores únicos e catálogo integrado", () => {
  assert.equal(study.version, 5);
  assert.equal(study.depth, "deep");
  assert.ok(study.intro.length > 1200);
  assert.ok(study.historicalContext.length > 900);
  assert.ok(study.application.length > 1000);
  assert.ok(study.sections.length >= 35);
  assert.ok(study.keyPoints.length >= 8);
  assert.ok(study.crossReferences.length >= 12);
  assert.ok(study.questions.length >= 15);
  assert.equal(new Set(study.sections.map((s) => s.id)).size, study.sections.length);
  assert.match(catalogue, /import \\{ matthew17Study \\} from "\\.\\/matthew-17-study";/);
  assert.equal((catalogue.match(/"biblia-mateus-cap-17": matthew17Study/g) ?? []).length, 1);
});

test("Mateus 17: sinaliza a variante textual e protege leitura pastoral da enfermidade e da fé", () => {
  const verse21 = study.sections.find((s) => s.id === "versiculo-21");
  assert.ok(verse21);
  assert.match(verse21.body, /variantes|manuscritas/i);
  assert.match(study.sections.find((s) => s.id === "pericope-menino").body, /médic|saúde|clínic/i);
  assert.match(study.sections.find((s) => s.id === "pericope-templo").body, /não|nem/);
});
