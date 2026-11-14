import { describe, expect, it } from "vitest";
import { proverbs25Study } from "./proverbs-25-study";
import { CURATED_STUDIES } from "./curated-studies";

describe("Provérbios 25 — integridade do estudo", () => {
  it("está integrado no catálogo canônico", () => {
    expect(CURATED_STUDIES["biblia-proverbios-cap-25"]).toBe(proverbs25Study);
  });
  it("contém 28 versículos em paráfrase livre e exposição individual", () => {
    const reading = proverbs25Study.sections.find((s) => s.id === "leitura-biblica");
    expect(reading?.body).toContain("Paráfrase livre");
    for (let n = 1; n <= 28; n++) {
      expect(reading?.body).toContain(`**${n}.**`);
      expect(proverbs25Study.sections.some((s) => s.id === `versiculo-${n}`)).toBe(true);
    }
  });
  it("contém contexto, perícopes, debates, exercícios, oficina e oração", () => {
    for (const id of ["contexto", "estrutura", "pericope-governo", "pericope-fala", "pericope-inimigo", "pericope-limites", "interpretacoes", "cristo", "exercicios", "oficina-pregador", "oracao"]) {
      expect(proverbs25Study.sections.some((s) => s.id === id)).toBe(true);
    }
    expect(new Set(proverbs25Study.sections.map((s) => s.id)).size).toBe(proverbs25Study.sections.length);
  });
});
