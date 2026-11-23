import { describe, expect, it } from "vitest";
import { philemon1Study } from "./philemon-1-study";
describe("Filemom 1 — integridade", () => {
 it("mantém 25 versículos identificados em ordem", () => {
  const leitura = philemon1Study.sections.find(s => s.id === "leitura-integral");
  expect(leitura).toBeDefined();
  const numeros = [...(leitura?.body ?? "").matchAll(/\*\*(\d+)\.\*\*/g)].map(m => Number(m[1]));
  expect(numeros).toEqual(Array.from({length:25},(_,i)=>i+1));
 });
 it("possui IDs únicos e seções editoriais fundamentais", () => {
  const ids=philemon1Study.sections.map(s=>s.id);
  expect(new Set(ids).size).toBe(ids.length);
  for(const id of ["contexto-e-genero","estrutura","pericope-8-16","referencias-cruzadas","etica-pastoral","interpretacao-inferencia","perguntas-respostas","oficina-pregador","oracao-final"]) expect(ids).toContain(id);
  for(let n=1;n<=25;n++)expect(ids).toContain(`exposicao-v${n}`);
 });
});
