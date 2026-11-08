import assert from "node:assert/strict";
import test from "node:test";
import { CURATED_STUDIES } from "../src/lib/content/curated-studies.ts";

test("Genesis 1 curated study remains available as a complete local fallback", () => {
  const study = CURATED_STUDIES["genesis-1-criacao"];

  assert.ok(study, "Genesis 1 must be registered in the curated study catalog");
  assert.equal(study.depth, "deep");
  assert.ok(Array.isArray(study.sections));
  assert.ok(study.sections.length >= 15, "the reviewed study must retain its full section set");
  assert.ok(study.sections.some((section) => section.title.includes("Introdução")));
  assert.ok(study.sections.some((section) => section.title.includes("Cristo")));
  assert.ok(study.sections.every((section) => section.body.trim().length > 0));
});
