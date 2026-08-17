/**
 * TTS do Professor IA (Dia 8).
 * Reutiliza o Lovable AI Gateway já usado pelo app; a chave permanece no servidor.
 * Retorna um arquivo de áudio (mp3) para reprodução com pausar/continuar/parar.
 */
import { createFileRoute } from "@tanstack/react-router";
import { authenticateRequest } from "@/lib/request-auth.server";
import { TTS_MAX_CHARS } from "@/lib/school/professor-tts";

type Body = { text?: unknown };

export const Route = createFileRoute("/api/escola/professor-tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await authenticateRequest(request);
        if (!auth) return new Response("Unauthorized", { status: 401 });

        const body = (await request.json()) as Body;
        const text = typeof body.text === "string" ? body.text.trim() : "";
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
        });

        if (!upstream.ok) {
          const detail = await upstream.text().catch(() => "");
          console.error(`TTS falhou [${upstream.status}]: ${detail}`);
          return new Response("Falha ao gerar áudio", { status: upstream.status });
        }

        const audio = await upstream.arrayBuffer();
        return new Response(audio, {
          headers: {
            "Content-Type": "audio/mpeg",
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});
