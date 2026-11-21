import { describe, expect, it } from "vitest";
import { titus3Study } from "./titus-3-study";

describe("Tito 3 — integridade", () => {
  it("identifica todos os 15 versículos em sequência", () => {
    const leitura = titus3Study.sections.find(s => s.id === "leitura-integral");
    expect(leitura?.body).toContain("Paráfrase livre original");
    const numeros = [...(leitura?.body ?? "").matchAll(/\*\*(\d+)\.\*\*/g)].map(m => Number(m[1]));
    expect(numeros).toEqual(Array.from({ length: 15 }, (_, i) => i + 1));
  });
  it("preserva exposições individuais e IDs únicos", () => {
    const ids = titus3Study.sections.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (let n = 1; n <= 15; n++) expect(ids).toContain(`exposicao-versiculo-${n}`);
    for (const id of ["contexto-literario", "pericope-1", "pericope-2", "pericope-3", "pericope-4", "interpretacao-inferencia", "referencias-cruzadas", "aplicacoes", "perguntas-respostas", "oficina-pregador", "oracao-final"]) expect(ids).toContain(id);
    expect(titus3Study.sections.every(s => s.body.trim().length > 0 && s.scriptureRefs.length > 0)).toBe(true);
  });
});
