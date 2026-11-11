import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const MAX_BODY_BYTES = 256 * 1024;
const RATE_LIMIT_WINDOW_SECONDS = 600;

async function readBoundedBody(request: Request): Promise<Uint8Array | null> {
  const declared = request.headers.get("content-length");
  if (declared !== null) {
    if (!/^\d+$/.test(declared) || !Number.isSafeInteger(Number(declared))) return null;
    if (Number(declared) > MAX_BODY_BYTES) return null;
  }
  if (!request.body) return null;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BODY_BYTES) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

async function enforceChatRateLimit(request: Request): Promise<Response | null> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const publishableKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  const authorization = request.headers.get("Authorization");
  if (!supabaseUrl || !publishableKey || !authorization?.startsWith("Bearer ")) {
    return new Response("Proteção de uso temporariamente indisponível", { status: 503, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/rpc/consume_ai_rate_limit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: publishableKey,
        Authorization: authorization,
      },
      body: JSON.stringify({ p_endpoint: "chat" }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      return new Response("Proteção de uso temporariamente indisponível", { status: 503, headers: { "Cache-Control": "no-store" } });
    }
    const payload = await response.json();
    const row = Array.isArray(payload) ? payload[0] : payload;
    if (!row || typeof row.allowed !== "boolean") {
      return new Response("Proteção de uso temporariamente indisponível", { status: 503, headers: { "Cache-Control": "no-store" } });
    }
    if (row.allowed) return null;
    const retryAfter = Number.isFinite(Number(row.retry_after_seconds))
      ? Math.max(1, Math.ceil(Number(row.retry_after_seconds)))
      : RATE_LIMIT_WINDOW_SECONDS;
    return new Response("Limite de uso excedido. Aguarde antes de tentar novamente.", {
      status: 429,
      headers: { "Cache-Control": "no-store", "Retry-After": String(retryAfter) },
    });
  } catch {
    return new Response("Proteção de uso temporariamente indisponível", { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: { Allow: "POST", "Cache-Control": "no-store" } });
  }
  if (!req.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return new Response("Content-Type inválido", { status: 415, headers: { "Cache-Control": "no-store" } });
  }

  // Only the app's own server may call this proxy; the server owns prompts and roles.
  const proxySecret = Deno.env.get("GEMINI_PROXY_SECRET");
  const provided = req.headers.get("x-gemini-proxy-secret");
  if (!proxySecret || !provided || provided !== proxySecret) {
    return new Response("Não autorizado", { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  const rateLimitResponse = await enforceChatRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  const body = await readBoundedBody(req);
  if (!body || body.byteLength === 0) {
    return new Response("Corpo JSON inválido ou acima do limite", { status: 413, headers: { "Cache-Control": "no-store" } });
  }
  let forwardBody: string;
  try {
    const parsed = JSON.parse(new TextDecoder().decode(body));
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.messages) || parsed.messages.length === 0 || parsed.messages.length > 200) {
      throw new Error("invalid");
    }
    const ALLOWED_ROLES = new Set(["system", "user", "assistant", "tool"]);
    for (const m of parsed.messages) {
      if (!m || typeof m !== "object" || !ALLOWED_ROLES.has(m.role)) throw new Error("invalid");
    }
    const allowed: Record<string, unknown> = { model: "gemini-2.5-flash", messages: parsed.messages };
    for (const k of ["stream", "temperature", "top_p", "max_tokens", "stop", "tools", "tool_choice", "response_format", "stream_options"]) {
      if (k in parsed) allowed[k] = parsed[k];
    }
    if (typeof allowed.max_tokens === "number") allowed.max_tokens = Math.min(Math.max(1, allowed.max_tokens), 16384);
    forwardBody = JSON.stringify(allowed);
  } catch {
    return new Response("Corpo JSON inválido", { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    return new Response("Serviço Gemini não configurado. Verifique GEMINI_API_KEY no Supabase.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  }

  try {
    const upstream = await fetch(GEMINI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: forwardBody,
      signal: AbortSignal.any([req.signal, AbortSignal.timeout(60_000)]),
    });
    const headers = new Headers({
      "Cache-Control": "no-store",
      "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
      "X-Content-Type-Options": "nosniff",
    });
    const retryAfter = upstream.headers.get("Retry-After");
    if (retryAfter) headers.set("Retry-After", retryAfter);
    return new Response(upstream.body, { status: upstream.status, headers });
  } catch {
    return new Response("Falha ao consultar o serviço Gemini", { status: 502, headers: { "Cache-Control": "no-store" } });
  }
});
