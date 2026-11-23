import { describe, expect, it } from "vitest";
import { romans15Study } from "./romans-15-study";
describe("Romanos 15 — integridade editorial", () => {
 it("confere 33 versículos, IDs únicos e referências estáveis", () => {
  const sections = romans15Study.sections ?? [];
  expect(new Set(sections.map(s => s.id)).size).toBe(sections.length);
  const verses = sections.filter(s => s.id.startsWith("versiculo-"));
  expect(verses).toHaveLength(33);
  for(let n=1;n<=33;n++) {
   expect(verses[n-1]?.id).toBe(`versiculo-${n}`);
   expect(verses[n-1]?.scriptureRefs).toContain(`Romanos 15:${n}`);
   expect(verses[n-1]?.body).toContain("Paráfrase explicativa livre");
   expect((verses[n-1]?.body.length??0)).toBeGreaterThan(140);
  }
 });
 it("mantém seções editoriais essenciais",()=>{
  for(const id of ["leitura-integral-romanos-15","contexto-historico-literario","estrutura-argumentativa","interpretacao-e-inferencia","referencias-cruzadas","conexao-com-cristo","aplicacoes-e-cuidados","perguntas-com-respostas","oficina-do-pregador","sintese-final","oracao-final"]) expect((romans15Study.sections?.find(s=>s.id===id)?.body.length??0)).toBeGreaterThan(100);
 });
});