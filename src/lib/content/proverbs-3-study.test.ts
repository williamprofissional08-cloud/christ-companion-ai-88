import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { proverbs3Study } from "./proverbs-3-study";
import { CURATED_STUDIES } from "./curated-studies";

/** Zero extra test dependencies: Node's built-in test runner, aligned to npm test. */
describe("Provérbios 3 — integridade do estudo", () => {
  const sections = proverbs3Study.sections ?? [];
  it("mantém o identificador canônico do catálogo", () => {
    assert.equal(CURATED_STUDIES["biblia-proverbios-cap-3"], proverbs3Study);
  });
  it("cobre os 35 versículos com paráfrase e explicação", () => {
    const reading = sections.find((section) => section.id === "leitura-biblica");
    assert.ok(reading?.body?.includes("Paráfrase livre"));
    for (let verse = 1; verse <= 35; verse++) {
      assert.ok(reading?.body?.includes(`**${verse}.**`), `Ausente Provérbios 3:${verse}`);
      assert.ok(sections.some((section) => section.id === `versiculo-${verse}`));
    }
  });
  it("preserva todas as seções editoriais e os IDs", () => {
    for (const id of ["exercicios","oficina-pregador","oracao","interpretacoes","cristo"]) {
      assert.ok(sections.some((section) => section.id === id), `Seção ausente: ${id}`);
    }
    assert.equal(new Set(sections.map((section) => section.id)).size, sections.length);
  });
});
