import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { finishAuthCallback } from "../src/lib/auth-callback-flow.ts";
import { getAuthEmailRedirectUrl } from "../src/lib/auth-redirect.ts";

function client(overrides = {}) {
  const calls = [];
  return {
    calls,
    getSession: async () => { calls.push("getSession"); return { data: { session: null }, error: null }; },
    getUser: async () => { calls.push("getUser"); return { data: { user: { id: "verified-user" } }, error: null }; },
    verifyOtp: async (input) => { calls.push(["verifyOtp", input]); return { error: null }; },
    exchangeCodeForSession: async (code) => { calls.push(["exchange", code]); return { error: null }; },
    setSession: async (input) => { calls.push(["setSession", input]); return { error: null }; },
    ...overrides,
  };
}

test("signup confirmation token hash is verified and then authenticated against the server", async () => {
  const auth = client({
    getSession: async () => ({ data: { session: { access_token: "session" } }, error: null }),
  });
  assert.equal(await finishAuthCallback(auth, "?token_hash=hash-123&type=signup", ""), "authenticated");
  assert.deepEqual(auth.calls, [["verifyOtp", { token_hash: "hash-123", type: "signup" }], "getUser"]);
});

test("PKCE redirect with no established session exchanges its code", async () => {
  const auth = client();
  assert.equal(await finishAuthCallback(auth, "?code=pkce-code", ""), "authenticated");
  assert.deepEqual(auth.calls, ["getSession", ["exchange", "pkce-code"], "getUser"]);
});

test("already-processed OAuth code does not get exchanged twice", async () => {
  const auth = client({
    getSession: async () => ({ data: { session: { access_token: "session" } }, error: null }),
    exchangeCodeForSession: async () => { throw new Error("unexpected duplicate exchange"); },
  });
  assert.equal(await finishAuthCallback(auth, "?code=processed-code", ""), "authenticated");
});

test("implicit email link fragment recovers session when automatic detection did not", async () => {
  const auth = client();
  assert.equal(await finishAuthCallback(auth, "", "#access_token=short-test-access&refresh_token=short-test-refresh&type=signup"), "authenticated");
  assert.deepEqual(auth.calls, [
    "getSession",
    ["setSession", { access_token: "short-test-access", refresh_token: "short-test-refresh" }],
    "getUser",
  ]);
});

test("no session means offer normal login, not repeat signup or erase any account", async () => {
  const auth = client({ getUser: async () => { throw new Error("must not call getUser without session"); } });
  assert.equal(await finishAuthCallback(auth, "", ""), "sign_in_required");
});

test("expired email links fail with a precise cause and never authenticate", async () => {
  const auth = client({ getSession: async () => { throw new Error("must not get session after link failure"); } });
  await assert.rejects(finishAuthCallback(auth, "?error_code=otp_expired&error_description=Email+link+expired", ""), /otp_expired/);
});

test("invalid, unexpected token hash type is rejected instead of silently falling through", async () => {
  await assert.rejects(finishAuthCallback(client(), "?token_hash=hash&type=unsupported", ""), /inválido/);
});

test("verification errors are not mistaken for successful signup", async () => {
  const auth = client({
    verifyOtp: async () => ({ error: { code: "otp_expired", message: "expired" } }),
  });
  await assert.rejects(finishAuthCallback(auth, "?token_hash=expired&type=signup", ""), { code: "otp_expired" });
});

test("locally stored sessions require a valid user response from the server", async () => {
  const auth = client({
    getSession: async () => ({ data: { session: { access_token: "wrong-project-token" } }, error: null }),
    getUser: async () => ({ data: { user: null }, error: { message: "invalid JWT" } }),
  });
  await assert.rejects(finishAuthCallback(auth, "", ""), { message: "invalid JWT" });
});

test("email links use the published URL, not a temporary preview host", () => {
  assert.equal(getAuthEmailRedirectUrl("/auth-callback"), "https://christ-companion-ai-88.lovable.app/auth-callback");
  assert.equal(getAuthEmailRedirectUrl("/reset-password"), "https://christ-companion-ai-88.lovable.app/reset-password");
});

test("confirmed email on a different browser is recognized even without an active session", async () => {
  const auth = client();
  assert.equal(
    await finishAuthCallback(auth, "?token_hash=valid-token&type=signup", ""),
    "email_verified",
  );
  assert.deepEqual(auth.calls, [
    ["verifyOtp", { token_hash: "valid-token", type: "signup" }],
    "getSession",
  ]);
});

test("Google and email signup use project-bound OAuth and the published confirmation page", () => {
  const source = readFileSync(new URL("../src/routes/auth.tsx", import.meta.url), "utf8");
  const callback = readFileSync(new URL("../src/routes/auth-callback.tsx", import.meta.url), "utf8");
  assert.match(source, /supabase\.auth\.signInWithOAuth\(/);
  assert.match(source, /provider: "google"/);
  assert.doesNotMatch(source, /lovable\.auth\.signInWithOAuth/);
  assert.match(source, /flow=signup/);
  assert.match(callback, /Conta criada com sucesso!/);
  assert.match(callback, /outcome === "email_verified"/);
});
