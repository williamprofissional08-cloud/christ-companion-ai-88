import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import {
  aiErrorMessage,
  aiResponsesModel,
  RESPONSES_PROVIDER_OPTIONS,
} from "@/lib/ai-gateway.server";
import { readLimitedJson } from "@/lib/request-body.server";
import { authenticateRequest } from "@/lib/request-auth.server";
import { buildProfessorSystemPrompt, loadLessonContext } from "@/lib/school/professor-ia.server";

type Body = { messages?: unknown; lessonId?: unknown };

const MAX_BODY_BYTES = 256 * 1024;
const MAX_MESSAGES = 40;
const MAX_PARTS_PER_MESSAGE = 100;
const MAX_TEXT_CHARS = 24_000;

function isValidMessage(message: unknown): message is UIMessage {
  if (!message || typeof message !== "object") return false;
  const candidate = message as { id?: unknown; role?: unknown; parts?: unknown };
  return (
    typeof candidate.id === "string" &&
    candidate.id.length > 0 &&
    candidate.id.length <= 128 &&
    (candidate.role === "user" || candidate.role === "assistant") &&
    Array.isArray(candidate.parts) &&
    candidate.parts.length <= MAX_PARTS_PER_MESSAGE &&
    candidate.parts.every(
      (part) =>
        !!part &&
        typeof part === "object" &&
        "type" in part &&
        typeof part.type === "string" &&
        (part.type !== "text" || ("text" in part && typeof part.text === "string")),
    )
  );
}

export const Route = createFileRoute("/api/escola/professor-ia")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const auth = await authenticateRequest(request);
          if (!auth) return new Response("Unauthorized", { status: 401 });

          const parsed = await readLimitedJson(request, MAX_BODY_BYTES);
          if (!parsed.ok) return parsed.response;

          const body = parsed.value as Body;
          const lessonId = body && typeof body.lessonId === "string" ? body.lessonId : null;
          const messages = body?.messages;

          if (
            !lessonId ||
            lessonId.length > 128 ||
            !Array.isArray(messages) ||
            messages.length === 0 ||
            messages.length > MAX_MESSAGES ||
            !messages.every(isValidMessage)
          ) {
            return new Response("Dados inválidos", { status: 400 });
          }

          const textChars = messages.reduce(
            (total: number, message: UIMessage) =>
              total +
              message.parts.reduce((partTotal, part) => {
                if (part.type === "text" && "text" in part) {
                  return partTotal + part.text.length;
                }
                return partTotal;
              }, 0),
            0,
          );
          if (textChars > MAX_TEXT_CHARS) {
            return new Response("A conversa excede o limite permitido", {
              status: 413,
            });
          }

          const last = messages[messages.length - 1];
          if (last?.role !== "user") {
            return new Response("A última mensagem precisa ser do usuário", {
              status: 400,
            });
          }

          const context = await loadLessonContext(auth.supabase, auth.userId, lessonId);
          if (!context) return new Response("Aula não disponível", { status: 404 });

          const result = streamText({
            model: aiResponsesModel(),
            system: buildProfessorSystemPrompt(context),
            messages: await convertToModelMessages(messages),
            providerOptions: RESPONSES_PROVIDER_OPTIONS,
            maxRetries: 2,
            onError: ({ error }) => {
              console.error("professor-ia stream error", error);
            },
          });

          return result.toUIMessageStreamResponse({
            sendReasoning: true,
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
