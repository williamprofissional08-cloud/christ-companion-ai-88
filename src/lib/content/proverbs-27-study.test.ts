import { describe, expect, it } from "vitest";
import { proverbs27Study } from "./proverbs-27-study";
import { CURATED_STUDIES } from "./curated-studies";

describe("Provérbios 27 — integridade do estudo", () => {
  it("está no catálogo canônico", () => {
    expect(CURATED_STUDIES["biblia-proverbios-cap-27"]).toBe(proverbs27Study);
  });
  it("identifica a paráfrase e expõe 27 versículos", () => {
    const reading = proverbs27Study.sections.find((s) => s.id === "leitura-biblica");
    expect(reading?.body).toContain("Paráfrase livre");
    for (let n = 1; n <= 27; n++) {
      expect(reading?.body).toContain(`**${n}.**`);
      expect(proverbs27Study.sections.some((s) => s.id === `versiculo-${n}`)).toBe(true);
    }
  });
  it("contém perícopes, debates, exercícios e oficina", () => {
    for (const id of ["estrutura", "pericope-amizade", "pericope-cuidado", "referencias", "debates", "cristo", "exercicios", "oficina-pregador", "oracao"]) {
      expect(proverbs27Study.sections.some((s) => s.id === id)).toBe(true);
    }
    expect(new Set(proverbs27Study.sections.map((s) => s.id)).size).toBe(proverbs27Study.sections.length);
  });
});
