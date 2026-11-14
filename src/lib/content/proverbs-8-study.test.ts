import { describe, expect, it } from "vitest";
import { proverbs8Study } from "./proverbs-8-study";
import { CURATED_STUDIES } from "./curated-studies";

describe("Provérbios 8 — integridade do estudo", () => {
  it("usa o identificador canônico", () => {
    expect(CURATED_STUDIES["biblia-proverbios-cap-8"]).toBe(proverbs8Study);
  });
  it("inclui 36 versículos em paráfrase livre e exposição", () => {
    const reading = proverbs8Study.sections.find((section) => section.id === "leitura-biblica");
    expect(reading?.body).toContain("Paráfrase livre");
    for (let verse = 1; verse <= 36; verse++) {
      expect(reading?.body).toContain(`**${verse}.**`);
      expect(proverbs8Study.sections.some((section) => section.id === `versiculo-${verse}`)).toBe(true);
    }
  });
  it("aborda o debate cristológico e os recursos editoriais", () => {
    for (const id of ["estrutura", "termos", "debate-criacao", "referencias", "cristo", "interpretacoes", "exercicios", "oficina-pregador", "oracao"]) {
      expect(proverbs8Study.sections.some((section) => section.id === id)).toBe(true);
    }
    expect(new Set(proverbs8Study.sections.map((section) => section.id)).size).toBe(proverbs8Study.sections.length);
  });
});
