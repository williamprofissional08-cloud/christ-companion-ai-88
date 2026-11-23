import { describe, expect, it } from "vitest";
import { romans13Study } from "./romans-13-study";
describe("Romanos 13 — integridade editorial", () => {
  it("cobre os 14 versículos em ordem, com exposição individual", () => {
    const reading=romans13Study.sections.find(s=>s.id==="leitura-integral-romanos-13");
    expect(reading?.body).toContain("Paráfrase livre autoral");
    const numbers=[...(reading?.body??"").matchAll(/\*\*(\d+)\*\*/g)].map(m=>Number(m[1]));
    expect(numbers).toEqual(Array.from({length:14},(_,i)=>i+1));
    for(let v=1;v<=14;v++) expect(romans13Study.sections.filter(s=>s.id===`exposicao-romanos-13-${String(v).padStart(2,"0")}`)).toHaveLength(1);
  });
  it("mantém IDs únicos, três perícopes e cuidados contra abuso de autoridade", () => {
    const ids=romans13Study.sections.map(s=>s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for(const id of ["pericope-autoridade","pericope-amor","pericope-esperanca","termos-e-questoes","referencias-comentadas","aplicacoes-cuidados","perguntas-respostas","oficina-pregador","oracao-final"])expect(ids).toContain(id);
    expect(romans13Study.sections.find(s=>s.id==="aplicacoes-cuidados")?.body).toContain("não legitima ditaduras");
    expect(romans13Study.crossReferences.length).toBeGreaterThanOrEqual(8);
  });
});
