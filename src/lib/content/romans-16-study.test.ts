import { describe, expect, it } from "vitest";
import { romans16Study } from "./romans-16-study";
describe("Romanos 16 — integridade editorial", () => {
 it("confere 27 versículos e referências únicas", () => {
  const sections = romans16Study.sections ?? [];
  expect(new Set(sections.map(s => s.id)).size).toBe(sections.length);
  const verses = sections.filter(s => s.id.startsWith("versiculo-"));
  expect(verses).toHaveLength(27);
  for (let n=1;n<=27;n++) {
   expect(verses[n-1]?.id).toBe(`versiculo-${n}`);
   expect(verses[n-1]?.scriptureRefs).toContain(`Romanos 16:${n}`);
   expect(verses[n-1]?.body).toContain("Paráfrase explicativa livre");
   expect((verses[n-1]?.body.length ?? 0)).toBeGreaterThan(250);
  }
 });
 it("inclui leitura integral e seções de interpretação e pregação", () => {
  for (const id of ["leitura-integral-romanos-16","introducao-e-contexto","estrutura-e-pericopes","interpretacao-e-inferencia","referencias-cruzadas","conexao-com-cristo","aplicacoes-e-cuidados","perguntas-com-respostas","oficina-do-pregador","sintese-final","oracao-final"])
   expect((romans16Study.sections?.find(s=>s.id===id)?.body.length??0)).toBeGreaterThan(100);
  const reading = romans16Study.sections?.find(s=>s.id==="leitura-integral-romanos-16")?.body ?? "";
  for (let n=1;n<=27;n++) expect(reading).toContain(`**${n}.**`);
  expect(reading).toContain("não tradução bíblica oficial");
  expect(reading).toContain("subscrição");
 });
});
