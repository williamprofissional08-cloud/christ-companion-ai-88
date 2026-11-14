import assert from "node:assert/strict";
import test from "node:test";
import { checkExistingAccountSession } from "../src/lib/auth-flow.ts";

test("existing authenticated account is recognised only after a successful user check", async () => {
  const result = await checkExistingAccountSession(async () => ({ data: { user: { id: "account-1" } }, error: null }));
  assert.equal(result, "authenticated");
});

test("no current user is signed out of the screen, without touching stored credentials", async () => {
  const result = await checkExistingAccountSession(async () => ({ data: { user: null }, error: null }));
  assert.equal(result, "signed-out");
});

test("a missing local session is normal for a first-time visitor", async () => {
  const result = await checkExistingAccountSession(async () => ({
    data: { user: null },
    error: { name: "AuthSessionMissingError", code: "session_not_found", message: "Auth session missing!" },
  }));
  assert.equal(result, "signed-out");
});

test("a thrown missing-session error does not show a network outage", async () => {
  const result = await checkExistingAccountSession(async () => {
    throw { name: "AuthSessionMissingError", message: "Auth session missing!" };
  });
  assert.equal(result, "signed-out");
});

test("temporary network/API errors never mean that an existing account is gone", async () => {
  const result = await checkExistingAccountSession(async () => ({
    data: { user: null },
    error: { status: 503, message: "Network request failed" },
  }));
  assert.equal(result, "unavailable");
});

test("verification exceptions leave stored authentication untouched", async () => {
  const result = await checkExistingAccountSession(async () => { throw new TypeError("Failed to fetch"); });
  assert.equal(result, "unavailable");
});

test("unresponsive auth service does not block the login form indefinitely", async () => {
  const result = await checkExistingAccountSession(() => new Promise(() => {}), 10);
  assert.equal(result, "unavailable");
});
