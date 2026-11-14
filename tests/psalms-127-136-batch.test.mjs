import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");
const bible = JSON.parse(readFileSync(new URL("../src/lib/bible-livre/salmos.json", import.meta.url), "utf8"));
const chapters = Array.from({length: 10}, (_, i) => 127 + i);

test("Lote de dez salmos segue os versículos existentes na BLIVRE e os IDs do aplicativo", () => {
  for (const n of chapters) {
    const code = readFileSync(new URL("../src/lib/content/psalm-" + n + "-study.ts", import.meta.url), "utf8");
    const a = code.indexOf(" = {\n"), b = code.lastIndexOf(";\n");
    assert.ok(a >= 0 && b > a, "Salmos " + n + ": JSON estático indisponível");
    const study = JSON.parse(code.slice(a + 3, b));
    const actualVerses = bible.chapters[String(n)];
    assert.ok(Array.isArray(actualVerses), "Salmos " + n + ": capítulo não encontrado na BLIVRE");
    const count = actualVerses.length;
    const reading = study.sections.find(s => s.id === "leitura-biblica");
    assert.ok(reading, "Salmos " + n + ": falta leitura");
    assert.match(reading.body, /Paráfrase livre/);
    const markers = [...reading.body.matchAll(/\*\*(\d+)\.\*\*/g)].map(match => Number(match[1]));
    assert.deepEqual(markers, Array.from({length: count}, (_, i) => i + 1), "Salmos " + n + ": versículos da paráfrase não correspondem ao texto bíblico");
    const exegeses = study.sections.filter(s => s.kind === "exegesis");
    for (let verse = 1; verse <= count; verse++) {
      assert.ok(exegeses.some(s => s.scriptureRefs.includes("Salmos " + n + ":" + verse)), "Salmos " + n + ":" + verse + " sem explicação exegética");
    }
    for (const section of exegeses) {
      for (const ref of section.scriptureRefs) {
        const match = ref.match(new RegExp("^Salmos " + n + ":(\\d+)$"));
        assert.ok(match, "Referência de comentário indevida em Salmos " + n + ": " + ref);
        assert.ok(Number(match[1]) >= 1 && Number(match[1]) <= count, "Versículo inexistente: " + ref);
        assert.ok(section.title.includes("Versículo " + match[1] + " —"), "Título e versículo divergentes: " + section.title + ", " + ref);
      }
    }
    assert.equal((catalog.match(new RegExp('"biblia-salmos-cap-' + n + '": psalm' + n + 'Study', "g")) ?? []).length, 1);
    assert.match(catalog, new RegExp('import \\{ psalm' + n + 'Study \\} from "\\./psalm-' + n + '-study";'));
    assert.equal(new Set(study.sections.map(s => s.id)).size, study.sections.length);
    assert.equal(new Set(study.sections.map(s => s.title)).size, study.sections.length);
  }
});

test("Salmos 136 preserva o refrão nos seus 26 versículos", () => {
  const source = readFileSync(new URL("../src/lib/content/psalm-136-study.ts", import.meta.url), "utf8");
  const study = JSON.parse(source.slice(source.indexOf(" = {\n") + 3, source.lastIndexOf(";\n")));
  const reading = study.sections.find(s => s.id === "leitura-biblica");
  assert.equal((reading.body.match(/Seu amor fiel permanece para sempre\./g) ?? []).length, 26);
});
