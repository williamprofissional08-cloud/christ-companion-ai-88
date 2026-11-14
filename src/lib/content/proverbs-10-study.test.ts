import { describe, expect, it } from "vitest";
import { proverbs10Study } from "./proverbs-10-study";
import { CURATED_STUDIES } from "./curated-studies";

describe("Provérbios 10 — integridade do estudo", () => {
  it("está registrado sob o ID canônico", () => {
    expect(CURATED_STUDIES["biblia-proverbios-cap-10"]).toBe(proverbs10Study);
  });
  it("contém 32 versículos em paráfrase livre e exposição individual", () => {
    const reading = proverbs10Study.sections.find((section) => section.id === "leitura-biblica");
    expect(reading?.body).toContain("Paráfrase livre");
    for (let verse = 1; verse <= 32; verse++) {
      expect(reading?.body).toContain(`**${verse}.**`);
      expect(proverbs10Study.sections.some((section) => section.id === `versiculo-${verse}`)).toBe(true);
    }
  });
  it("apresenta os recursos editoriais obrigatórios", () => {
    for (const id of ["contexto", "estrutura", "paralelismo", "termos", "referencias", "interpretacoes", "cristo", "exercicios", "oficina-pregador", "oracao"]) {
      expect(proverbs10Study.sections.some((section) => section.id === id)).toBe(true);
    }
    expect(new Set(proverbs10Study.sections.map((section) => section.id)).size).toBe(proverbs10Study.sections.length);
  });
});
