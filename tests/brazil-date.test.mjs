import test from "node:test";
import assert from "node:assert/strict";
import { getBrazilDateISO } from "../src/lib/brazil-date.ts";

test("uses Brasília date before and after midnight", () => {
  assert.equal(getBrazilDateISO(new Date("2026-11-12T02:59:59.000Z")), "2026-11-11");
  assert.equal(getBrazilDateISO(new Date("2026-11-12T03:00:00.000Z")), "2026-11-12");
});

test("does not depend on the runtime machine time zone", () => {
  assert.equal(getBrazilDateISO(new Date("2026-11-13T02:59:59.000Z")), "2026-11-12");
  assert.equal(getBrazilDateISO(new Date("2026-11-13T03:00:00.000Z")), "2026-11-13");
});
