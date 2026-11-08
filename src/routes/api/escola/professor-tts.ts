/**
 * TTS do Professor IA (Dia 8).
 * Reutiliza o Lovable AI Gateway; a chave permanece somente no servidor.
 */
import { createFileRoute } from "@tanstack/react-router";
import { authenticateRequest } from "@/lib/request-auth.server";
import { readLimitedJson } from "@/lib/request-body.server";
import { TTS_MAX_CHARS } from "@/lib/school/professor-tts";

type Body = { text?: unknown };

const MAX_BODY_BYTES = 16 * 1024;

export const Route = createFileRoute("/api/escola/professor-tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const auth = await authenticateRequest(request);
          if (!auth) return new Response("Unauthorized", { status: 401 });

          const parsed = await readLimitedJson(request, MAX_BODY_BYTES);
          if (!parsed.ok) return parsed.response;

          const body = parsed.value as Body;
          const text = body && typeof body.text === "string" ? body.text.trim() : "";
          if (!text || text.length > TTS_MAX_CHARS + 500) {
            return new Response("Texto inválido para narração", { status: 400 });
          }

          const apiKey = process.env["LOVABLE_API_KEY"];
          if (!apiKey) return new Response("TTS indisponível", { status: 503 });

          const upstream = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: "openai/gpt-4o-mini-tts",
              input: text,
              voice: "alloy",
              response_format: "mp3",
              instructions:
                "Fale em português do Brasil, com tom pastoral, acolhedor e didático, em ritmo calmo.",
            }),
            signal: AbortSignal.timeout(30_000),
          });

          if (!upstream.ok) {
            console.error(`TTS falhou [${upstream.status}]`);
            return new Response("Falha ao gerar áudio", { status: upstream.status });
          }

          const audio = await upstream.arrayBuffer();
          return new Response(audio, {
            headers: {
              "Content-Type": "audio/mpeg",
              "Cache-Control": "no-store",
              "X-Content-Type-Options": "nosniff",
            },
          });
        } catch (error) {
          console.error("TTS request failed", error);
          return new Response("Não foi possível gerar o áudio agora", { status: 502 });
        }
      },
    },
  },
});
