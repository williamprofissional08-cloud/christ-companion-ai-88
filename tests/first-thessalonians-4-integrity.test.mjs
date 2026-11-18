import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = readFileSync(new URL("../src/lib/content/first-thessalonians-4-study.ts", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");
test("1 Tessalonicenses 4 — leitura completa e estrutura editorial", () => {
  assert.match(source, /Paráfrase livre original para estudo/);
  const reading = source.slice(source.indexOf("leitura-integral"), source.indexOf("introducao", source.indexOf("leitura-integral")));
  for (let verse=1; verse<=18; verse++) assert.ok(reading.includes("**"+verse+".**"), "versículo "+verse+" ausente");
  for (const id of ["pericope-1","pericope-2","pericope-3","pericope-4","interpretacao-inferencia","referencias-cruzadas","passagens-sensiveis","perguntas-respostas","oficina-pregador","oracao"]) assert.ok(source.includes('"id": "'+id+'"'), id+" ausente");
  assert.equal((catalog.match(/"biblia-1-tessalonicenses-cap-4": firstThessalonians4Study/g)||[]).length,1);
  assert.equal((catalog.match(/import \{ firstThessalonians4Study \} from "\.\/first-thessalonians-4-study";/g)||[]).length,1);
});
