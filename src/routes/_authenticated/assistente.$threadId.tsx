import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { ArrowLeft, MessageCircleHeart, Send, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { MarkdownContent } from "@/components/MarkdownContent";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { getThreadMessages } from "@/lib/chat.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/assistente/$threadId")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Conversa — Assistente bíblico" },
      {
        name: "description",
        content:
          "Converse com o assistente bíblico e receba respostas com referências das Escrituras.",
      },
      { property: "og:title", content: "Conversa — Assistente bíblico" },
      { property: "og:description", content: "Respostas fundamentadas na Bíblia Sagrada." },
    ],
  }),
  component: ThreadPage,
});

const SUGESTOES = [
  "Faça o estudo completo do Salmo 23, versículo por versículo.",
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

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
        {messages.length === 0 ? (
          <Card className="overflow-hidden rounded-3xl border-border/60 bg-gradient-to-br from-primary/[0.07] via-card to-card p-5 shadow-soft sm:p-7">
            <div className="flex items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Sparkles className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-serif text-lg font-semibold tracking-tight">
                  A Bíblia tem respostas para a vida real.
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Estou aqui para ajudar você a encontrar, entender e aplicar a Palavra de Deus no
                  seu dia a dia.
                </p>
              </div>
            </div>
            <div className="mt-5 border-t border-border/50 pt-4">
              <p className="flex items-center gap-2 text-sm font-medium">
                <MessageCircleHeart className="size-4 text-primary" aria-hidden="true" /> Comece com
                uma destas perguntas
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {SUGESTOES.map((s) => (
                  <Button
                    key={s}
                    variant="outline"
                    size="sm"
                    className="h-auto justify-start whitespace-normal rounded-xl border-primary/15 bg-background/70 px-3 py-2 text-left leading-snug hover:border-primary/40 hover:bg-primary/5"
                    onClick={() => {
                      setErrorMessage(null);
                      void sendMessage({ text: s });
                    }}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          </Card>
        ) : null}

        {messages.map((message) => {
          const text = message.parts
            .map((part) => (part.type === "text" ? part.text : ""))
            .join("");
          const mine = message.role === "user";
          return (
            <div key={message.id} className={mine ? "flex justify-end" : "flex justify-start"}>
              <div
                className={
                  mine
                    ? "max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-3 text-sm whitespace-pre-wrap text-primary-foreground shadow-sm"
                    : "max-w-[92%] rounded-2xl rounded-bl-md border border-border/60 bg-card px-4 py-3 shadow-soft"
                }
              >
                {mine ? text : <MarkdownContent>{text}</MarkdownContent>}
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

        {busy ? (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 text-sm text-muted-foreground"
          >
            <span className="flex items-center gap-1" aria-hidden="true">
              <span className="size-2 animate-bounce rounded-full bg-primary [animation-delay:-0.2s]" />
              <span className="size-2 animate-bounce rounded-full bg-primary [animation-delay:-0.1s]" />
              <span className="size-2 animate-bounce rounded-full bg-primary" />
            </span>
            <span>
              {status === "submitted"
                ? "Consultando as referências bíblicas e preparando a resposta..."
                : "O assistente está escrevendo a resposta..."}
            </span>
          </div>
        ) : null}
        <div ref={bottomRef} />
      </div>

      <div className="sticky bottom-20 mt-6 lg:bottom-4">
        <Card className="flex flex-row items-end gap-2 rounded-2xl border-border/60 bg-card/95 p-2.5 shadow-soft backdrop-blur sm:p-3">
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
            className="min-h-11 resize-none rounded-xl border-0 bg-transparent shadow-none focus-visible:ring-0"
          />
          <Button
            variant="hero"
            size="icon"
            className="shrink-0 rounded-xl"
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
