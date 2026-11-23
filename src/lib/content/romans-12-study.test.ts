import { describe, expect, it } from "vitest";
import { romans12Study } from "./romans-12-study";
describe("Romanos 12 — integridade editorial", () => {
  it("cobre exatamente 21 versículos com paráfrase e exposição", () => {
    const reading = romans12Study.sections.find(s => s.id === "leitura-livre-romanos-12");
    expect(reading?.body).toContain("paráfrase livre interpretativa");
    const marks = [...(reading?.body ?? "").matchAll(/\*\*(\d+)\*\*/g)].map(m => Number(m[1]));
    expect(marks).toEqual(Array.from({length:21},(_,i)=>i+1));
    for(let v=1;v<=21;v++) expect(romans12Study.sections.filter(s=>s.id===`exegese-verso-${v}`)).toHaveLength(1);
  });
  it("preserva IDs únicos, perícopes e cuidados pastorais", () => {
    const ids=romans12Study.sections.map(s=>s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for(const id of ["contexto-literario","interpretacoes-e-limites","referencias-cruzadas","aplicacao-e-cuidados","perguntas-com-respostas","oficina-do-pregador","oracao-final"]) expect(ids).toContain(id);
    expect(romans12Study.sections.filter(s=>s.id.startsWith("culto-")||s.id==="humildade-e-corpo"||s.id==="dons-e-responsabilidade"||s.id==="amor-comunitario"||s.id==="solidariedade-e-paz"||s.id==="vinganca-e-bem")).toHaveLength(6);
    expect(romans12Study.crossReferences.length).toBeGreaterThanOrEqual(8);
  });
});
