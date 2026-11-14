import { describe, expect, it } from "vitest";
import { proverbs20Study } from "./proverbs-20-study";
import { CURATED_STUDIES } from "./curated-studies";

describe("Provérbios 20 — integridade editorial", () => {
  it("está integrado ao catálogo canônico", () => {
    expect(CURATED_STUDIES["biblia-proverbios-cap-20"]).toBe(proverbs20Study);
  });
  it("contém 30 versículos em paráfrase livre e exposição", () => {
    const reading = proverbs20Study.sections.find((section) => section.id === "leitura-biblica");
    expect(reading?.body).toContain("Paráfrase livre");
    for (let verse = 1; verse <= 30; verse++) {
      expect(reading?.body).toContain(`**${verse}.**`);
      expect(proverbs20Study.sections.some((section) => section.id === `versiculo-${verse}`)).toBe(true);
    }
  });
  it("abrange todas as exigências editoriais principais", () => {
    for (const id of ["contexto", "estrutura", "termos", "referencias", "cristo", "interpretacoes", "cuidados", "exercicios", "oficina-pregador", "oracao"]) {
      expect(proverbs20Study.sections.some((section) => section.id === id)).toBe(true);
    }
    expect(new Set(proverbs20Study.sections.map((section) => section.id)).size).toBe(proverbs20Study.sections.length);
  });
});
