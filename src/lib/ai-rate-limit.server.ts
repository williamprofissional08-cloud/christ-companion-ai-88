export const AI_RATE_LIMIT_POLICIES = {
  chat: { limit: 20, windowSeconds: 600 },
  professor_ia: { limit: 15, windowSeconds: 600 },
  professor_tts: { limit: 8, windowSeconds: 600 },
} as const;

export type AiRateLimitEndpoint = keyof typeof AI_RATE_LIMIT_POLICIES;

type RateLimitClient = {
  rpc: (
    functionName: "consume_ai_rate_limit",
    args: {
      p_endpoint: AiRateLimitEndpoint;
      p_limit: number;
      p_window_seconds: number;
    },
  ) => PromiseLike<{ data: unknown; error: unknown }>;
};

type RateLimitRow = {
  allowed?: unknown;
  retry_after_seconds?: unknown;
};

/**
 * Uses a Postgres RPC so limits are atomic and shared across server instances.
 * Fails closed when the limiter cannot be reached; AI routes must not silently
 * become unmetered during a database outage.
 */
export async function enforceAiRateLimit(
  supabase: RateLimitClient,
  endpoint: AiRateLimitEndpoint,
): Promise<Response | null> {
  const policy = AI_RATE_LIMIT_POLICIES[endpoint];

  try {
    const { data, error } = await supabase.rpc("consume_ai_rate_limit", {
      p_endpoint: endpoint,
      p_limit: policy.limit,
      p_window_seconds: policy.windowSeconds,
    });

    if (error) {
      console.error("AI rate limit check failed");
      return new Response("Proteção de uso temporariamente indisponível", {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      });
    }

    const row = (Array.isArray(data) ? data[0] : data) as RateLimitRow | null;
    if (!row || typeof row.allowed !== "boolean") {
      console.error("AI rate limit returned an invalid response");
      return new Response("Proteção de uso temporariamente indisponível", {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      });
    }

    if (row.allowed) return null;

    const retryAfter = Number.isFinite(Number(row.retry_after_seconds))
      ? Math.max(1, Math.ceil(Number(row.retry_after_seconds)))
      : policy.windowSeconds;

    return new Response(
      "Limite de uso excedido. Tente novamente após o intervalo indicado.",
      {
        status: 429,
      headers: {
        "Cache-Control": "no-store",
        "Retry-After": String(retryAfter),
      },
    });
  } catch {
    console.error("AI rate limit request failed");
    return new Response("Proteção de uso temporariamente indisponível", {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
