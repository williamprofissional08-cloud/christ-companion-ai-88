import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { proverbs10Study } from "./proverbs-10-study";
import { CURATED_STUDIES } from "./curated-studies";

/** Node's built-in test runner: no Vitest dependency required. */
describe("Provérbios 10 — integridade do estudo", () => {
  const sections = proverbs10Study.sections ?? [];
  it("preserva o registro no catálogo", () => {
    assert.equal(CURATED_STUDIES["biblia-proverbios-cap-10"], proverbs10Study);
  });
  it("mantém os 32 versículos e seus comentários", () => {
    const reading = sections.find((section) => section.id === "leitura-biblica");
    assert.ok(reading?.body?.includes("Paráfrase livre"));
    for (let verse = 1; verse <= 32; verse++) {
      assert.ok(reading?.body?.includes(`**${verse}.**`));
      assert.ok(sections.some((section) => section.id === `versiculo-${verse}`));
    }
  });
  it("preserva recursos editoriais e IDs únicos", () => {
    for (const id of ["contexto","estrutura","paralelismo","termos","referencias","interpretacoes","cristo","exercicios","oficina-pregador","oracao"]) assert.ok(sections.some((section) => section.id === id));
    assert.equal(new Set(sections.map((section) => section.id)).size, sections.length);
  });
});
