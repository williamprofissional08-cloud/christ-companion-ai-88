import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { aiGateway, CHAT_MODEL, PROVIDER_OPTIONS } from "@/lib/ai-gateway.server";
import { authenticateRequest } from "@/lib/request-auth.server";
import {
  buildProfessorSystemPrompt,
  loadLessonContext,
} from "@/lib/school/professor-ia.server";

type Body = { messages?: unknown; lessonId?: unknown };

export const Route = createFileRoute("/api/escola/professor-ia")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await authenticateRequest(request);
        if (!auth) return new Response("Unauthorized", { status: 401 });

        const body = (await request.json()) as Body;
        const lessonId = typeof body.lessonId === "string" ? body.lessonId : null;
        if (!Array.isArray(body.messages) || !body.messages.length || !lessonId) {
          return new Response("Dados inválidos", { status: 400 });
        }

        const context = await loadLessonContext(auth.supabase, auth.userId, lessonId);
        if (!context) return new Response("Aula não disponível", { status: 404 });

        const gateway = aiGateway();
        const result = streamText({
          model: gateway(CHAT_MODEL),
          system: buildProfessorSystemPrompt(context),
          messages: await convertToModelMessages(body.messages as UIMessage[]),
          providerOptions: PROVIDER_OPTIONS,
        });

        return result.toUIMessageStreamResponse();
      },
    },
  },
});
