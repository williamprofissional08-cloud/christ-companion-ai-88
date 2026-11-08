import assert from "node:assert/strict";
import test from "node:test";
import { AI_RATE_LIMIT_POLICIES, enforceAiRateLimit } from "../src/lib/ai-rate-limit.server.ts";
import { readLimitedJson, readLimitedResponseBytes } from "../src/lib/request-body.server.ts";

test("AI endpoints have explicit and independent usage policies", () => {
  assert.deepEqual(AI_RATE_LIMIT_POLICIES, {
    chat: { limit: 20, windowSeconds: 600 },
    professor_ia: { limit: 15, windowSeconds: 600 },
    professor_tts: { limit: 8, windowSeconds: 600 },
  });
});

test("rate limit RPC is called with the endpoint policy and allows requests", async () => {
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
  assert.deepEqual(call.args, { p_endpoint: "chat" });
});

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

test("rate limiter fails closed on database errors", async () => {
  const client = {
    rpc: async () => ({ data: null, error: new Error("database unavailable") }),
  };

  const response = await enforceAiRateLimit(client, "professor_ia");

  assert.equal(response.status, 503);
});

test("rate limiter fails closed when the RPC request throws", async () => {
  const client = {
    rpc: async () => {
      throw new Error("network unavailable");
    },
  };

  const response = await enforceAiRateLimit(client, "chat");

  assert.equal(response.status, 503);
});

test("rate limiter fails closed on invalid RPC results", async () => {
  const client = {
    rpc: async () => ({ data: [], error: null }),
  };

  const response = await enforceAiRateLimit(client, "chat");

  assert.equal(response.status, 503);
});

test("JSON reader accepts valid JSON", async () => {
  const request = new Request("https://example.test/api", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message: "olá" }),
  });

  const result = await readLimitedJson(request, 100);

  assert.equal(result.ok, true);
  assert.deepEqual(result.value, { message: "olá" });
});

test("JSON reader rejects malformed JSON", async () => {
  const request = new Request("https://example.test/api", {
    method: "POST",
    body: "{invalid",
  });

  const result = await readLimitedJson(request, 100);

  assert.equal(result.ok, false);
  assert.equal(result.response.status, 400);
});

test("JSON reader rejects an invalid Content-Length", async () => {
  const request = new Request("https://example.test/api", {
    method: "POST",
    headers: { "content-length": "-1" },
    body: "{}",
  });

  const result = await readLimitedJson(request, 100);

  assert.equal(result.ok, false);
  assert.equal(result.response.status, 400);
});

test("JSON reader rejects an empty request body", async () => {
  const request = new Request("https://example.test/api", {
    method: "POST",
  });

  const result = await readLimitedJson(request, 100);

  assert.equal(result.ok, false);
  assert.equal(result.response.status, 400);
});

test("JSON reader rejects oversized declared bodies", async () => {
  const request = new Request("https://example.test/api", {
    method: "POST",
    headers: { "content-length": "101" },
    body: "{}",
  });

  const result = await readLimitedJson(request, 100);

  assert.equal(result.ok, false);
  assert.equal(result.response.status, 413);
});

test("JSON reader rejects oversized streamed bodies", async () => {
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

test("audio response reader accepts a body within the configured limit", async () => {
  const response = new Response(new Uint8Array([1, 2, 3]), {
    headers: { "content-type": "audio/mpeg", "content-length": "3" },
  });

  const bytes = await readLimitedResponseBytes(response, 3);

  assert.deepEqual([...bytes], [1, 2, 3]);
});

test("audio response reader rejects oversized declared responses", async () => {
  const response = new Response(new Uint8Array([1]), {
    headers: { "content-length": "9" },
  });

  const bytes = await readLimitedResponseBytes(response, 8);

  assert.equal(bytes, null);
});

test(
  "audio response reader rejects oversized streamed responses without Content-Length",
  async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array([1, 2, 3]));
        controller.enqueue(new Uint8Array([4, 5, 6]));
        controller.close();
      },
    });
    const response = new Response(stream);

    const bytes = await readLimitedResponseBytes(response, 5);

    assert.equal(bytes, null);
  },
);

test("audio response reader rejects malformed Content-Length", async () => {
  const response = new Response(new Uint8Array([1]), {
    headers: { "content-length": "unknown" },
  });

  const bytes = await readLimitedResponseBytes(response, 8);

  assert.equal(bytes, null);
});

test("audio response reader rejects empty responses", async () => {
  const response = new Response(new Uint8Array());

  const bytes = await readLimitedResponseBytes(response, 8);

  assert.equal(bytes, null);
});
