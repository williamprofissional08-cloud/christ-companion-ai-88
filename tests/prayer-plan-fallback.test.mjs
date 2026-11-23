import assert from "node:assert/strict";
import test from "node:test";
import { PRAYER_PLANS } from "../src/lib/content/plans.ts";
import { getPlanDayFallback } from "../src/lib/content/plan-day-fallback.ts";
import { readFileSync } from "node:fs";

test("todos os planos possuem uma leitura de contingência por dia, sem conteúdo vazio", () => {
  assert.ok(PRAYER_PLANS.length >= 40);
  const keys = ["title", "reading", "readingSummary", "meditation", "prayer", "challenge", "question"];
  for (const plan of PRAYER_PLANS) {
    for (const day of [1, Math.min(7, plan.days), plan.days]) {
      const content = getPlanDayFallback(plan, day);
      for (const key of keys) assert.ok(typeof content[key] === "string" && content[key].trim().length > 8, `${plan.slug} dia ${day} sem ${key}`);
      assert.equal(content.reading, plan.keyVerse);
      assert.match(content.title, new RegExp(`Dia ${day} de ${plan.days}`));
    }
  }
});

test("plano conserva cache salvo e não grava a leitura temporária como estudo definitivo", () => {
  const source = readFileSync(new URL("../src/lib/ai.functions.ts", import.meta.url), "utf8");
  assert.match(source, /if \(cached\.data\?\.content\) return/);
  assert.match(source, /return getPlanDayFallback\(plan, data\.day\)/);
  assert.ok(source.indexOf('if (cached.data?.content) return') < source.indexOf('return getPlanDayFallback(plan, data.day)'));
});
