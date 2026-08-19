import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { ArrowLeft, Send } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { getThreadMessages } from "@/lib/chat.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/assistente/$threadId")({
  head: () => ({
    meta: [
      { title: "Conversa — Assistente bíblico" },
      {
        name: "description",
        content: "Converse com o assistente bíblico e receba respostas com referências das Escrituras.",
      },
      { property: "og:title", content: "Conversa — Assistente bíblico" },
      { property: "og:description", content: "Respostas fundamentadas na Bíblia Sagrada." },
    ],
  }),
  component: ThreadPage,
});

const SUGESTOES = [
  "Explique o Salmo 23 versículo por versículo.",
  "O que a Bíblia ensina sobre a ansiedade?",
  "Qual o contexto histórico da carta aos Romanos?",
  "Faça uma oração por sabedoria para minhas decisões.",
];

function ThreadPage() {
  const { threadId } = Route.useParams();
  const loadMessages = useServerFn(getThreadMessages);
  const history = useQuery({
    queryKey: ["thread", threadId],
    queryFn: () => loadMessages({ data: { id: threadId } }),
    staleTime: Infinity,
  });

  if (history.isLoading) {
    return (
      <AppShell title="Assistente bíblico">
        <Skeleton className="h-64 w-full" />
      </AppShell>
    );
  }

  if (history.isError || !history.data) {
    return (
      <AppShell title="Assistente bíblico">
        <p className="text-sm text-muted-foreground">Conversa não encontrada.</p>
        <Button asChild variant="outline" size="sm" className="mt-4">
          <Link to="/assistente">Voltar às conversas</Link>
        </Button>
      </AppShell>
    );
  }

  return (
    <ChatWindow
      key={threadId}
      threadId={threadId}
      title={history.data.title}
      initial={history.data.messages as unknown as UIMessage[]}
    />
  );
}

function ChatWindow({
  threadId,
  title,
  initial,
}: {
  threadId: string;
  title: string;
  initial: UIMessage[];
}) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { threadId },
        headers: async () => {
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
      }),
    [threadId],
  );

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { messages, sendMessage, status } = useChat({
    id: threadId,
    messages: initial,
    transport,
    onError: (error) => {
      const message =
        error.message?.trim() && !/^\s*(failed|error)/i.test(error.message)
          ? error.message.trim()
          : "O assistente não conseguiu responder agora. Tente novamente.";
      setErrorMessage(message);
      toast.error(message);
    },
  });

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    inputRef.current?.focus();
  }, [threadId, busy]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function submit() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setErrorMessage(null);
    void sendMessage({ text });
  }

  return (
    <AppShell title={title} subtitle="Respostas com referências bíblicas.">
      <Button asChild variant="ghost" size="sm" className="mb-4 gap-2">
        <Link to="/assistente">
          <ArrowLeft className="size-4" /> Conversas
        </Link>
      </Button>

      <div className="flex flex-col gap-4">
        {messages.length === 0 ? (
          <Card className="border-border/50 p-6 shadow-soft">
            <p className="text-sm text-muted-foreground">Comece com uma destas perguntas:</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {SUGESTOES.map((s) => (
                <Button
                  key={s}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setErrorMessage(null);
                    void sendMessage({ text: s });
                  }}
                >
                  {s}
                </Button>
              ))}
            </div>
          </Card>
        ) : null}

        {messages.map((message) => {
          const text = message.parts
            .map((part) => (part.type === "text" ? part.text : ""))
            .join("");
          const mine = message.role === "user";
          return (
            <div
              key={message.id}
              className={mine ? "flex justify-end" : "flex justify-start"}
            >
              <div
                className={
                  mine
                    ? "max-w-[85%] rounded-2xl bg-primary px-4 py-3 text-sm text-primary-foreground"
                    : "max-w-[85%] rounded-2xl border border-border/60 bg-card px-4 py-3 text-sm whitespace-pre-wrap"
                }
              >
                {text}
              </div>
            </div>
          );
        })}

        {errorMessage ? (
          <Card className="border-destructive/40 bg-destructive/5 p-4 shadow-soft">
            <p className="text-sm text-foreground">{errorMessage}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setErrorMessage(null)}
            >
              Entendi
            </Button>
          </Card>
        ) : null}

        {status === "submitted" ? (
          <div className="text-sm text-muted-foreground">O assistente está buscando na Palavra...</div>
        ) : null}
        <div ref={bottomRef} />
      </div>

      <div className="sticky bottom-20 mt-6 lg:bottom-4">
        <Card className="flex flex-row items-end gap-2 border-border/50 p-3 shadow-soft">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submit();
              }
            }}
            rows={2}
            placeholder="Pergunte sobre um versículo, tema ou peça uma oração..."
            className="min-h-11 resize-none border-0 shadow-none focus-visible:ring-0"
          />
          <Button
            variant="hero"
            size="icon"
            onClick={submit}
            disabled={busy || !input.trim()}
            aria-label="Enviar"
          >
            <Send className="size-4" />
          </Button>
        </Card>
      </div>
    </AppShell>
  );
}
