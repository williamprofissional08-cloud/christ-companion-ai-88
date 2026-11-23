import { describe, expect, it } from "vitest";
import { galatians2Study } from "./galatians-2-study";
describe("Gálatas 2 — integridade editorial", () => {
 it("cobre 21 versículos com IDs e referências únicos", () => {
  const s=galatians2Study.sections ?? [];
  expect(new Set(s.map(x=>x.id)).size).toBe(s.length);
  const v=s.filter(x=>x.id.startsWith("versiculo-"));
  expect(v).toHaveLength(21);
  for(let n=1;n<=21;n++){expect(v[n-1]?.id).toBe(`versiculo-${n}`);expect(v[n-1]?.scriptureRefs).toContain(`Gálatas 2:${n}`);expect((v[n-1]?.body.length??0)).toBeGreaterThan(280);}
 });
 it("contém leitura integral e seções editoriais essenciais",()=>{
  const s=galatians2Study.sections??[];
  for(const id of ["leitura-integral-galatas-2","introducao-e-contexto","estrutura-e-genero","termos-e-questoes-interpretativas","referencias-cruzadas","cristologia-e-redencao","interpretacao-e-inferencia","aplicacoes-e-cuidados","perguntas-com-respostas","oficina-do-pregador","sintese-e-glossario","oracao-final"])expect((s.find(x=>x.id===id)?.body.length??0)).toBeGreaterThan(100);
  const reading=s.find(x=>x.id==="leitura-integral-galatas-2")?.body??"";
  for(let n=1;n<=21;n++)expect(reading).toContain(`**${n}.**`);
  expect(reading).toContain("não tradução bíblica oficial");
 });
});
