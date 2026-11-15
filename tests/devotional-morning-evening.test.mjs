import test from "node:test";
import assert from "node:assert/strict";
import { getBrazilDateISO, getBrazilDevotionalPeriod, getBrazilHour } from "../src/lib/brazil-date.ts";
import { CURATED_DEVOTIONALS, getDailyDevotional, getDevotionalForPeriod, getEveningDevotional } from "../src/lib/content/daily-devotional.ts";
import { EVENING_DEVOTIONALS } from "../src/lib/content/evening-devotionals.ts";

test("horário recomendado usa Brasília e troca o destaque às 20h", () => {
  assert.equal(getBrazilDateISO(new Date("2026-11-16T02:59:59Z")), "2026-11-15");
  assert.equal(getBrazilDateISO(new Date("2026-11-16T03:00:00Z")), "2026-11-16");
  assert.equal(getBrazilHour(new Date("2026-11-15T09:00:00Z")), 6);
  assert.equal(getBrazilHour(new Date("2026-11-15T23:00:00Z")), 20);
  assert.equal(getBrazilDevotionalPeriod(new Date("2026-11-15T22:59:59Z")), "manha");
  assert.equal(getBrazilDevotionalPeriod(new Date("2026-11-15T23:00:00Z")), "noite");
});

test("duas leituras completas por dia, com seleção noturna estável e sem repetição imediata", () => {
  assert.equal(CURATED_DEVOTIONALS.length, 30);
  assert.equal(EVENING_DEVOTIONALS.length, 14);
  const start = Date.UTC(2026, 10, 1);
  let previousNight;
  for (let offset = 0; offset < 95; offset += 1) {
    const day = new Date(start + offset * 86_400_000).toISOString().slice(0, 10);
    const morning = getDevotionalForPeriod(day, "manha");
    const night = getDevotionalForPeriod(day, "noite");
    assert.strictEqual(morning, getDailyDevotional(day));
    assert.strictEqual(night, getEveningDevotional(day));
    assert.notStrictEqual(morning, night);
    assert.notStrictEqual(night, previousNight, "Repetiu o devocional noturno em " + day);
    for (const value of [morning, night]) {
      for (const field of ["theme", "context", "biblicalMeaning", "reflection", "application", "prayer", "challenge", "question", "readingSuggestion"]) {
        assert.ok(value[field]?.trim().length > 15, field + " incompleto em " + day);
      }
      assert.ok(value.verse.reference.length > 3);
      assert.equal(value.verse.kind, "synthesis");
    }
    previousNight = night;
  }
});

test("as 14 leituras noturnas atendem ao padrão de conteúdo integral", () => {
  const themes = new Set();
  const references = new Set();
  for (const devotional of EVENING_DEVOTIONALS) {
    assert.ok(devotional.context.length >= 150, devotional.theme + ": contexto incompleto");
    assert.ok(devotional.biblicalMeaning.length >= 130, devotional.theme + ": significado incompleto");
    assert.ok(devotional.reflection.length >= 650, devotional.theme + ": reflexão curta");
    assert.ok(devotional.reflection.split("\n\n").length >= 3, devotional.theme + ": faltam parágrafos");
    assert.ok(devotional.prayer.length >= 130, devotional.theme + ": oração curta");
    assert.ok(devotional.readingSuggestion.includes(":"), devotional.theme + ": leitura não indicada");
    themes.add(devotional.theme);
    references.add(devotional.verse.reference);
  }
  assert.equal(themes.size, 14);
  assert.equal(references.size, 14);
});

test("datas inválidas não selecionam conteúdo", () => {
  for (const invalid of ["2026-02-30", "abc", "2026-13-01", ""]) {
    assert.throws(() => getEveningDevotional(invalid));
  }
});
