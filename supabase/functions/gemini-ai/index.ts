import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    return new Response("Serviço Gemini não configurado. Verifique GEMINI_API_KEY no Supabase.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  }
  let body: unknown;
  try { body = await req.json(); } catch {
    return new Response("Corpo JSON inválido", { status: 400 });
  }
  const upstream = await fetch(GEMINI_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify(body),
    signal: req.signal,
  });
  const headers = new Headers({
    "Cache-Control": "no-store",
    "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
    "X-Content-Type-Options": "nosniff",
  });
  const retryAfter = upstream.headers.get("Retry-After");
  if (retryAfter) headers.set("Retry-After", retryAfter);
  return new Response(upstream.body, { status: upstream.status, headers });
});