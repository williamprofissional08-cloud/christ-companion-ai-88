import { describe, expect, it } from "vitest";
import { secondCorinthians10Study } from "./second-corinthians-10-study";
import { CURATED_STUDIES } from "./curated-studies";

describe("2 Coríntios 10 — integridade", () => {
  it("contém paráfrase original para os 18 versículos em ordem", () => {
    const reading = secondCorinthians10Study.sections.find((section) => section.id === "leitura-integral");
    expect(reading?.body).toContain("Paráfrase livre original");
    const markers = [...(reading?.body ?? "").matchAll(/\*\*(\d+)\.\*\*/g)].map((match) => Number(match[1]));
    expect(markers).toEqual(Array.from({ length: 18 }, (_, i) => i + 1));
  });
  it("possui IDs únicos, exposição e blocos editoriais essenciais", () => {
    const ids = secondCorinthians10Study.sections.map((section) => section.id);
    expect(ids.length).toBeGreaterThanOrEqual(30);
    expect(new Set(ids).size).toBe(ids.length);
    for (let i = 1; i <= 18; i++) expect(ids).toContain(`exposicao-versiculo-${i}`);
    for (const id of ["contexto-historico", "interpretacao-inferencia", "referencias-cruzadas", "cuidados-sensiveis", "perguntas-respostas", "oficina-pregador", "oracao-final"]) expect(ids).toContain(id);
  });
  it("registra o slug oficial uma vez no catálogo", () => {
    expect(CURATED_STUDIES["biblia-2-corintios-cap-10"]).toBe(secondCorinthians10Study);
  });
});
