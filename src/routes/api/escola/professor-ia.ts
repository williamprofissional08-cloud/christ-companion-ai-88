import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import {
  aiErrorMessage,
  aiResponsesModel,
  RESPONSES_PROVIDER_OPTIONS,
} from "@/lib/ai-gateway.server";
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
        try {
          const auth = await authenticateRequest(request);
          if (!auth) return new Response("Unauthorized", { status: 401 });

          const body = (await request.json()) as Body;
          const lessonId = typeof body.lessonId === "string" ? body.lessonId : null;
          if (!Array.isArray(body.messages) || !body.messages.length || !lessonId) {
            return new Response("Dados inválidos", { status: 400 });
          }

          const context = await loadLessonContext(auth.supabase, auth.userId, lessonId);
          if (!context) return new Response("Aula não disponível", { status: 404 });

          const result = streamText({
            model: aiResponsesModel(),
            system: buildProfessorSystemPrompt(context),
            // Mantém o histórico da conversa da sessão para perguntas de seguimento.
            messages: await convertToModelMessages(body.messages as UIMessage[]),
            providerOptions: RESPONSES_PROVIDER_OPTIONS,
            maxRetries: 2,
            onError: ({ error }) => {
              console.error("professor-ia stream error", error);
            },
          });

          return result.toUIMessageStreamResponse({
            sendReasoning: true,
            // Erros durante o streaming chegam ao cliente já traduzidos.
            onError: (error) => aiErrorMessage(error),
          });
        } catch (error) {
          console.error("professor-ia failed", error);
          return new Response(aiErrorMessage(error), { status: 502 });
        }
      },
    },
  },
});
