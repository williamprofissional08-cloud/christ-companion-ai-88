import assert from "node:assert/strict";
import test from "node:test";
import {
  AI_RATE_LIMIT_POLICIES,
  enforceAiRateLimit,
} from "../src/lib/ai-rate-limit.server.ts";
import { readLimitedJson } from "../src/lib/request-body.server.ts";

test("AI endpoints have explicit and independent usage policies", () => {
  assert.deepEqual(AI_RATE_LIMIT_POLICIES, {
    chat: { limit: 20, windowSeconds: 600 },
    professor_ia: { limit: 15, windowSeconds: 600 },
    professor_tts: { limit: 8, windowSeconds: 600 },
  });
});

test(
  "rate limit RPC is called with the endpoint policy and allows requests",
  async () => {
    let call;
    const client = {
      rpc: async (name, args) => {
        call = { name, args };
        return { data: [{ allowed: true, retry_after_seconds: 0 }], error: null };
      },
    };

    const response = await enforceAiRateLimit(client, "chat");

    assert.equal(response, null);
    assert.equal(call.name, "consume_ai_rate_limit");
    assert.deepEqual(call.args, {
      p_endpoint: "chat",
      p_limit: 20,
      p_window_seconds: 600,
    });
  },
);

test("rate limit denial returns 429 and Retry-After", async () => {
  const client = {
    rpc: async () => ({
      data: [{ allowed: false, retry_after_seconds: 37 }],
      error: null,
    }),
  };

  const response = await enforceAiRateLimit(client, "professor_tts");

  assert.equal(response.status, 429);
  assert.equal(response.headers.get("retry-after"), "37");
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("rate limiter fails closed when the database reports an error", async () => {
  const client = {
    rpc: async () => ({ data: null, error: new Error("database unavailable") }),
  };

  const response = await enforceAiRateLimit(client, "professor_ia");

  assert.equal(response.status, 503);
});

test("rate limiter fails closed when the RPC response is malformed", async () => {
  const client = {
    rpc: async () => ({ data: [], error: null }),
  };

  const response = await enforceAiRateLimit(client, "chat");

  assert.equal(response.status, 503);
});

test("limited JSON reader accepts a valid JSON body", async () => {
  const request = new Request("https://example.test/api", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message: "olá" }),
  });

  const result = await readLimitedJson(request, 100);

  assert.equal(result.ok, true);
  assert.deepEqual(result.value, { message: "olá" });
});

test("limited JSON reader rejects malformed JSON", async () => {
  const request = new Request("https://example.test/api", {
    method: "POST",
    body: "{invalid",
  });

  const result = await readLimitedJson(request, 100);

  assert.equal(result.ok, false);
  assert.equal(result.response.status, 400);
});

test("limited JSON reader rejects declared oversized bodies", async () => {
  const request = new Request("https://example.test/api", {
    method: "POST",
    headers: { "content-length": "101" },
    body: "{}",
  });

  const result = await readLimitedJson(request, 100);

  assert.equal(result.ok, false);
  assert.equal(result.response.status, 413);
});

test("limited JSON reader rejects oversized streamed bodies without Content-Length", async () => {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode("12345"));
      controller.close();
    },
  });
  const request = new Request("https://example.test/api", {
    method: "POST",
    body: stream,
    duplex: "half",
  });

  const result = await readLimitedJson(request, 4);

  assert.equal(result.ok, false);
  assert.equal(result.response.status, 413);
});
