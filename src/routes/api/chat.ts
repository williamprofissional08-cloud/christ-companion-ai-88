import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import {
  aiErrorMessage,
  aiResponsesModel,
  BIBLICAL_SYSTEM_PROMPT,
  RESPONSES_PROVIDER_OPTIONS,
} from "@/lib/ai-gateway.server";
import { authenticateRequest } from "@/lib/request-auth.server";

type Body = { messages?: unknown; threadId?: unknown };

const MAX_CHAT_BODY_BYTES = 256 * 1024;
const MAX_CHAT_MESSAGES = 40;
const MAX_CHAT_PARTS_PER_MESSAGE = 100;
const MAX_CHAT_TEXT_CHARS = 24_000;

/**
 * Reads the request incrementally so requests without Content-Length cannot
 * allocate an unbounded body before the size limit is checked.
 */
async function readLimitedBody(request: Request, maxBytes: number): Promise<string | null> {
  if (!request.body) return "";

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;

      if (totalBytes > maxBytes) {
        await reader.cancel();
        return null;
      }

      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new TextDecoder().decode(body);
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const contentLength = request.headers.get("content-length");
          if (contentLength !== null) {
            const declaredLength = Number(contentLength);
            if (!Number.isSafeInteger(declaredLength) || declaredLength < 0) {
              return new Response("Content-Length inválido", { status: 400 });
            }
            if (declaredLength > MAX_CHAT_BODY_BYTES) {
              return new Response("Solicitação muito grande", { status: 413 });
            }
          }

          const rawBody = await readLimitedBody(request, MAX_CHAT_BODY_BYTES);
          if (rawBody === null) {
            return new Response("Solicitação muito grande", { status: 413 });
          }

          let body: Body;
          try {
            body = JSON.parse(rawBody) as Body;
          } catch {
            return new Response("JSON inválido", { status: 400 });
          }

          const auth = await authenticateRequest(request);
          if (!auth) return new Response("Unauthorized", { status: 401 });

          const messages = body?.messages;
          const threadId = typeof body?.threadId === "string" ? body.threadId : null;
          if (
            !Array.isArray(messages) ||
            messages.length === 0 ||
            messages.length > MAX_CHAT_MESSAGES ||
            !threadId ||
            threadId.length > 80
          ) {
            return new Response("Dados inválidos", { status: 400 });
          }

          const hasOnlySupportedMessages = messages.every((message) => {
            if (!message || typeof message !== "object") return false;
            if (!("role" in message) || !("parts" in message) || !("id" in message)) {
              return false;
            }
            const candidate = message as { id?: unknown; role?: unknown; parts?: unknown };
            return (
              typeof candidate.id === "string" &&
              candidate.id.length > 0 &&
              candidate.id.length <= 128 &&
              (candidate.role === "user" || candidate.role === "assistant") &&
              Array.isArray(candidate.parts) &&
              candidate.parts.length <= MAX_CHAT_PARTS_PER_MESSAGE &&
              candidate.parts.every(
                (part) =>
                  !!part &&
                  typeof part === "object" &&
                  "type" in part &&
                  typeof part.type === "string",
              )
            );
          });
          if (!hasOnlySupportedMessages) {
            return new Response("Formato de mensagem inválido", { status: 400 });
          }

          const textChars = messages.reduce((total: number, message: unknown) => {
            if (!message || typeof message !== "object" || !("parts" in message)) return total;
            const parts = (message as { parts: unknown[] }).parts;
            return (
              total +
              parts.reduce((partTotal: number, part: unknown) => {
                if (
                  part &&
                  typeof part === "object" &&
                  "type" in part &&
                  part.type === "text" &&
                  "text" in part &&
                  typeof part.text === "string"
                ) {
                  return partTotal + part.text.length;
                }
                return partTotal;
              }, 0)
            );
          }, 0);

          if (textChars > MAX_CHAT_TEXT_CHARS) {
            return new Response("A conversa excede o limite permitido", { status: 413 });
          }

          const uiMessages = messages as UIMessage[];
          const last = uiMessages[uiMessages.length - 1];
          if (last?.role !== "user") {
            return new Response("A última mensagem precisa ser do usuário", { status: 400 });
          }

          const thread = await auth.supabase
            .from("chat_threads")
            .select("id, title")
            .eq("id", threadId)
            .eq("user_id", auth.userId)
            .maybeSingle();
          if (!thread.data) return new Response("Conversa não encontrada", { status: 404 });

          const { error: saveUserError } = await auth.supabase.from("chat_messages").insert({
            user_id: auth.userId,
            thread_id: threadId,
            role: "user",
            message: last as never,
          });
          if (saveUserError) console.error("save user message failed", saveUserError.message);

          const firstTextPart = last.parts?.find((part) => part.type === "text");
          const firstText =
            firstTextPart && "text" in firstTextPart && typeof firstTextPart.text === "string"
              ? firstTextPart.text
              : "";
          await auth.supabase
            .from("chat_threads")
            .update({
              ...(thread.data.title === "Nova conversa" && firstText
                ? { title: firstText.slice(0, 60) }
                : {}),
              updated_at: new Date().toISOString(),
            })
            .eq("id", threadId)
            .eq("user_id", auth.userId);

          const result = streamText({
            model: aiResponsesModel(),
            system: BIBLICAL_SYSTEM_PROMPT,
            messages: await convertToModelMessages(uiMessages),
            providerOptions: RESPONSES_PROVIDER_OPTIONS,
            maxRetries: 2,
            onError: ({ error }) => {
              console.error("chat stream error", error);
            },
          });

          return result.toUIMessageStreamResponse({
            originalMessages: uiMessages,
            sendReasoning: true,
            onError: (error) => aiErrorMessage(error),
            onFinish: async ({ responseMessage }) => {
              const { error } = await auth.supabase.from("chat_messages").insert({
                user_id: auth.userId,
                thread_id: threadId,
                role: "assistant",
                message: responseMessage as never,
              });
              if (error) console.error("save assistant message failed", error.message);
            },
          });
        } catch (error) {
          console.error("chat failed", error);
          return new Response(aiErrorMessage(error), { status: 502 });
        }
      },
    },
  },
});
