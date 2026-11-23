import { describe, expect, it } from "vitest";
import { romans14Study } from "./romans-14-study";
describe("Romanos 14 — integridade editorial", () => {
 it("cobre os 23 versículos com IDs estáveis e únicos", () => {
  const sections = romans14Study.sections ?? [];
  expect(new Set(sections.map(s => s.id)).size).toBe(sections.length);
  const verses = sections.filter(s => /^versiculo-\d+$/.test(s.id));
  expect(verses).toHaveLength(23);
  for (let n=1;n<=23;n++) { expect(verses[n-1]?.id).toBe(`versiculo-${n}`); expect(verses[n-1]?.scriptureRefs).toContain(`Romanos 14:${n}`); expect(verses[n-1]?.body).toContain("Paráfrase explicativa livre"); expect((verses[n-1]?.body.length??0)).toBeGreaterThan(140); }
 });
 it("inclui leitura, contexto, interpretação, aplicação e oficina",()=>{
  for(const id of ["leitura-integral-romanos-14","contexto-historico-literario","estrutura-argumentativa","interpretacao-e-inferencia","referencias-cruzadas","conexao-com-cristo","aplicacoes-e-cuidados","perguntas-com-respostas","oficina-do-pregador","sintese-final","oracao-final"]) expect((romans14Study.sections?.find(s=>s.id===id)?.body.length??0)).toBeGreaterThan(100);
 });
});
