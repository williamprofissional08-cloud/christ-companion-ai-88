import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getBrazilDateISO } from "../src/lib/brazil-date.ts";
import {
  CURATED_DEVOTIONALS,
  getDailyDevotional,
  curatedDevotionalCount,
} from "../src/lib/content/daily-devotional.ts";

const dayISO = (epochDay) => new Date(epochDay * 86_400_000).toISOString().slice(0, 10);

test("acervo autoral contém 30 devocionais reais e completos, não combinações genéricas", () => {
  assert.equal(curatedDevotionalCount(), 30);
  assert.equal(CURATED_DEVOTIONALS.length, 30);

  const references = new Set();
  const themes = new Set();
  for (const devotional of CURATED_DEVOTIONALS) {
    assert.equal(devotional.verse.kind, "synthesis", "síntese não deve parecer citação bíblica literal");
    assert.match(devotional.verse.reference, /\\d+:\\d+/);
    assert.ok(devotional.verse.text.length > 35);
    for (const key of ["theme", "context", "biblicalMeaning", "reflection", "application", "prayer", "challenge", "question", "motivational", "readingSuggestion"]) {
      assert.ok(typeof devotional[key] === "string" && devotional[key].trim().length > 30, `Campo ${key} incompleto em ${devotional.theme}`);
    }
    assert.ok(devotional.context.length >= 150, `Contexto breve demais: ${devotional.theme}`);
    assert.ok(devotional.biblicalMeaning.length >= 130, `Sentido bíblico breve demais: ${devotional.theme}`);
    assert.ok(devotional.reflection.length >= 650, `Reflexão breve demais: ${devotional.theme}`);
    assert.ok(devotional.reflection.split("\\n\\n").length >= 3, `Reflexão não desenvolvida em três parágrafos: ${devotional.theme}`);
    assert.ok(devotional.prayer.length >= 130, `Oração breve demais: ${devotional.theme}`);
    assert.match(devotional.readingSuggestion, /\\d+:\\d+/);
    references.add(devotional.verse.reference);
    themes.add(devotional.theme);
  }
  assert.equal(references.size, 30, "Nenhuma passagem principal deve ser duplicada no acervo");
  assert.equal(themes.size, 30, "Cada leitura precisa de tema próprio");
});

test("a escolha fica fixa para a mesma data independentemente de novas chamadas", () => {
  const date = "2026-11-14";
  const devotional = getDailyDevotional(date);
  assert.strictEqual(getDailyDevotional(date), devotional);
  assert.strictEqual(getDailyDevotional(date), devotional);
});

test("a ordem é embaralhada por ciclo sem repetição dentro dos 30 dias", () => {
  const n = curatedDevotionalCount();
  const start = 20700;
  const aligned = Math.ceil(start / n) * n;
  for (const round of [aligned, aligned + n, aligned + 2 * n]) {
    const ids = Array.from({ length: n }, (_, i) => getDailyDevotional(dayISO(round + i)).theme);
    assert.equal(new Set(ids).size, n, "O mesmo devocional se repetiu dentro de um ciclo");
  }
});

test("devocional muda a cada dia e não repete no limite de um ciclo", () => {
  const start = 20700;
  const ids = Array.from({ length: 400 }, (_, i) => getDailyDevotional(dayISO(start + i)).theme);
  for (let i = 1; i < ids.length; i += 1) {
    assert.notEqual(ids[i], ids[i - 1], `O devocional repetiu em dias consecutivos na posição ${i}`);
  }
});

test("virada da meia-noite de Brasília seleciona o dia seguinte", () => {
  const before = getBrazilDateISO(new Date("2026-11-15T02:59:59Z"));
  const after = getBrazilDateISO(new Date("2026-11-15T03:00:00Z"));
  assert.equal(before, "2026-11-14");
  assert.equal(after, "2026-11-15");
  assert.notEqual(getDailyDevotional(before).theme, getDailyDevotional(after).theme);
});

test("datas inexistentes são rejeitadas", () => {
  assert.throws(() => getDailyDevotional("2026-02-30"), /inválida/);
  assert.throws(() => getDailyDevotional("data-invalida"), /inválida/);
});

test("início e página devocional usam o mesmo acervo fixo, sem sorteio manual ou geração na UI", () => {
  const home = readFileSync(new URL("../src/routes/_authenticated/inicio.tsx", import.meta.url), "utf8");
  const route = readFileSync(new URL("../src/routes/_authenticated/devocional.tsx", import.meta.url), "utf8");
  const loader = readFileSync(new URL("../src/lib/devotional-loader.ts", import.meta.url), "utf8");
  assert.match(home, /loadDevotionalSafely\\(day\\)/);
  assert.match(route, /loadDevotionalSafely\\(day\\)/);
  assert.match(loader, /getDailyDevotional\\(day\\)/);
  assert.doesNotMatch(route, /Sortear outro|Math\\.random/);
  assert.doesNotMatch(home, /getDevotional/);
  assert.doesNotMatch(route, /getDevotional/);
});
