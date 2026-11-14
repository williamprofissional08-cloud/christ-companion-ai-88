import test from "node:test";
import assert from "node:assert/strict";
import {
  checkLiveBackendReady,
  explainLiveBackendError,
  explainLiveMediaError,
  isMissingMediaDevice,
} from "../src/lib/live-startup-errors.ts";

test("missing live tables are not reported as camera permission failures", async () => {
  const calls = [];
  const issue = await checkLiveBackendReady(async table => {
    calls.push(table);
    if (table === "community_live_participants") {
      return { code:"PGRST205", message:"Could not find table in schema cache" };
    }
    return null;
  });
  assert.match(issue, /tabelas necessárias/);
  assert.match(issue, /Não é um problema/);
  assert.deepEqual(calls, ["community_live_sessions", "community_live_participants"]);
});

test("healthy server performs all three checks without a camera request", async () => {
  const tables = [];
  const result = await checkLiveBackendReady(async table => {
    tables.push(table);
    return null;
  });
  assert.equal(result, null);
  assert.deepEqual(tables, ["community_live_sessions","community_live_participants","community_live_signals"]);
});

test("RLS and auth errors point to server permissions and login", () => {
  assert.match(explainLiveBackendError({ code:"42501",message:"permission denied" }), /RLS/);
  assert.match(explainLiveBackendError({ status:401,message:"invalid JWT" }), /sessão/);
  assert.match(explainLiveBackendError({ status:503 }), /servidor/);
});

test("real camera errors remain distinct", () => {
  assert.match(explainLiveMediaError({name:"NotAllowedError"}), /navegador/);
  assert.match(explainLiveMediaError({name:"NotReadableError"}), /ocupado/);
  assert.match(explainLiveMediaError({name:"NotFoundError"}), /não encontrado/);
  assert.equal(isMissingMediaDevice({name:"NotFoundError"}), true);
  assert.equal(isMissingMediaDevice({name:"NotAllowedError"}), false);
});
