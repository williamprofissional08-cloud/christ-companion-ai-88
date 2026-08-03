import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import {
  aiGateway,
  BIBLICAL_SYSTEM_PROMPT,
  CHAT_MODEL,
  PROVIDER_OPTIONS,
} from "@/lib/ai-gateway.server";
import { authenticateRequest } from "@/lib/request-auth.server";

type Body = { messages?: unknown; threadId?: unknown };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await authenticateRequest(request);
        if (!auth) return new Response("Unauthorized", { status: 401 });

        const body = (await request.json()) as Body;
        const messages = body.messages;
        const threadId = typeof body.threadId === "string" ? body.threadId : null;
        if (!Array.isArray(messages) || !threadId) {
          return new Response("Dados inválidos", { status: 400 });
        }

        const thread = await auth.supabase
          .from("chat_threads")
          .select("id, title")
          .eq("id", threadId)
          .eq("user_id", auth.userId)
          .maybeSingle();
        if (!thread.data) return new Response("Conversa não encontrada", { status: 404 });

        const uiMessages = messages as UIMessage[];
        const last = uiMessages[uiMessages.length - 1];
        if (last?.role === "user") {
          const { error } = await auth.supabase.from("chat_messages").insert({
            user_id: auth.userId,
            thread_id: threadId,
            role: "user",
            message: last as never,
          });
          if (error) console.error("save user message failed", error.message);

          const firstText =
            last.parts?.find((p) => p.type === "text" && "text" in p)?.type === "text"
              ? (last.parts.find((p) => p.type === "text") as { text: string }).text
              : "";
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
        }

        const gateway = aiGateway();
        const result = streamText({
          model: gateway(CHAT_MODEL),
          system: BIBLICAL_SYSTEM_PROMPT,
          messages: await convertToModelMessages(uiMessages),
          providerOptions: PROVIDER_OPTIONS,
        });

        return result.toUIMessageStreamResponse({
          originalMessages: uiMessages,
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
      },
    },
  },
});
