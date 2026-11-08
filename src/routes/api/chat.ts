import { createFileRoute } from "@tanstack/react-router";
import {
  convertToModelMessages,
  streamText,
  type UIMessage,
} from "ai";
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
const MAX_CHAT_TEXT_CHARS = 24_000;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const declaredLength = Number(request.headers.get("content-length") ?? 0);
          if (declaredLength > MAX_CHAT_BODY_BYTES) {
            return new Response("Solicitação muito grande", { status: 413 });
          }

          const rawBody = await request.text();
          if (new TextEncoder().encode(rawBody).byteLength > MAX_CHAT_BODY_BYTES) {
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

          const textChars = messages.reduce((total: number, message: unknown) => {
            if (!message || typeof message !== "object" || !("parts" in message)) return total;
            const parts = (message as { parts?: unknown }).parts;
            if (!Array.isArray(parts)) return total;
            return total + parts.reduce((partTotal: number, part: unknown) => {
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
            }, 0);
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

          const firstText = last.parts?.find((part) => part.type === "text")?.text ?? "";
          if (thread.data.title === "Nova conversa" && firstText) {
            await auth.supabase
              .from("chat_threads")
              .update({ title: firstText.slice(0, 60), updated_at: new Date().toISOString() })
              .eq("id", threadId)
              .eq("user_id", auth.userId);
          } else {
            await auth.supabase
              .from("chat_threads")
              .update({ updated_at: new Date().toISOString() })
              .eq("id", threadId)
              .eq("user_id", auth.userId);
          }

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
