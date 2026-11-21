import { describe, expect, it } from "vitest";
import { secondCorinthians9Study } from "./second-corinthians-9-study";
import { CURATED_STUDIES } from "./curated-studies";

describe("2 Coríntios 9 — integridade", () => {
  it("cobre os 15 versículos em ordem na paráfrase original", () => {
    const reading = secondCorinthians9Study.sections.find((section) => section.id === "leitura-integral");
    expect(reading?.body).toContain("Paráfrase livre original");
    const markers = [...(reading?.body ?? "").matchAll(/\*\*(\d+)\.\*\*/g)].map((match) => Number(match[1]));
    expect(markers).toEqual(Array.from({ length: 15 }, (_, i) => i + 1));
  });
  it("preserva IDs únicos e blocos editoriais", () => {
    const ids = secondCorinthians9Study.sections.map((section) => section.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (let i = 1; i <= 15; i++) expect(ids).toContain(`exposicao-versiculo-${i}`);
    for (const id of ["contexto-historico", "interpretacao-inferencia", "referencias-cruzadas", "cuidados-sensiveis", "perguntas-respostas", "oficina-pregador", "oracao-final"]) expect(ids).toContain(id);
  });
  it("registra o slug oficial", () => {
    expect(CURATED_STUDIES["biblia-2-corintios-cap-9"]).toBe(secondCorinthians9Study);
  });
});
