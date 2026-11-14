import { describe, expect, it } from "vitest";
import { proverbs23Study } from "./proverbs-23-study";
import { CURATED_STUDIES } from "./curated-studies";

describe("Provérbios 23 — integridade do estudo", () => {
  it("usa o identificador canônico do catálogo", () => {
    expect(CURATED_STUDIES["biblia-proverbios-cap-23"]).toBe(proverbs23Study);
  });
  it("inclui paráfrase identificada e exposição dos 35 versículos", () => {
    const reading = proverbs23Study.sections.find((s) => s.id === "leitura-biblica");
    expect(reading?.body).toContain("Paráfrase livre");
    for (let n = 1; n <= 35; n++) {
      expect(reading?.body).toContain(`**${n}.**`);
      expect(proverbs23Study.sections.some((s) => s.id === `versiculo-${n}`)).toBe(true);
    }
  });
  it("contém perícopes, referências, debates, exercícios e oficina", () => {
    for (const id of ["estrutura", "unidade-mesa", "unidade-vulneraveis", "unidade-familia", "unidade-bebida", "termos", "referencias", "debates", "cristo", "exercicios", "oficina-pregador", "oracao"]) {
      expect(proverbs23Study.sections.some((s) => s.id === id)).toBe(true);
    }
    expect(new Set(proverbs23Study.sections.map((s) => s.id)).size).toBe(proverbs23Study.sections.length);
  });
});
