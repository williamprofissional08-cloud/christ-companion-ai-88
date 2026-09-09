import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { GraduationCap, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ProfessorAnswerAudio } from "@/components/school/ProfessorAnswerAudio";
import { supabase } from "@/integrations/supabase/client";
import {
  PROFESSOR_IA_ERROR,
  PROFESSOR_IA_LOADING,
  PROFESSOR_IA_SUBTITLE,
  PROFESSOR_IA_TITLE,
  PROFESSOR_SUGGESTIONS,
} from "@/lib/school/professor-ia";

/**
 * Professor IA (Dia 7) — auxiliar de estudo da aula atual.
 * Aditivo: usado apenas na página da aula da Escola Bíblica.
 * A conversa vive no estado local da sessão (sem novas tabelas).
 */
export function ProfessorIA({ lessonId, lessonTitle }: { lessonId: string; lessonTitle: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Card className="space-y-3 p-5">
      <div className="flex items-center gap-2">
        <GraduationCap className="size-4 text-primary" aria-hidden />
        <h2 className="font-display text-base font-semibold">{PROFESSOR_IA_TITLE}</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Ficou com alguma dúvida sobre esta aula? Pergunte ao Professor IA.
      </p>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="w-full gap-2">
            <Sparkles className="size-4" aria-hidden /> Perguntar ao Professor IA
          </Button>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="flex h-[92dvh] flex-col gap-0 p-0 sm:h-[88dvh] sm:mx-auto sm:max-w-2xl"
        >
          <SheetHeader className="border-b border-border/60 p-4 text-left">
            <SheetTitle className="font-display">{PROFESSOR_IA_TITLE}</SheetTitle>
            <SheetDescription>{PROFESSOR_IA_SUBTITLE}</SheetDescription>
          </SheetHeader>
          {open ? <ProfessorChat lessonId={lessonId} lessonTitle={lessonTitle} /> : null}
        </SheetContent>
      </Sheet>
    </Card>
  );
}

function ProfessorChat({ lessonId, lessonTitle }: { lessonId: string; lessonTitle: string }) {
  const [input, setInput] = useState("");
  const [failed, setFailed] = useState(false);
  const [emptyWarning, setEmptyWarning] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/escola/professor-ia",
        body: { lessonId },
        headers: async () => {
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
      }),
    [lessonId],
  );

  const { messages, sendMessage, status, error } = useChat({
    id: `professor-ia-${lessonId}`,
    transport,
    onError: (err) => {
      console.error("professor-ia client error", err);
      setFailed(true);
    },
  });

  const busy = status === "submitted" || status === "streaming";

  // Mensagem amigável: usa o texto vindo do servidor quando existir.
  const errorMessage = failed
    ? (error?.message && error.message.length > 3 && !error.message.includes("{")
        ? error.message
        : PROFESSOR_IA_ERROR)
    : null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  function ask(text: string) {
    const value = text.trim();
    if (!value) {
      setEmptyWarning(true);
      return;
    }
    if (busy) return;
    setEmptyWarning(false);
    setFailed(false);
    void sendMessage({ text: value });
  }


  return (
    <>
      <div className="flex-1 space-y-3 overflow-y-auto overscroll-contain p-4">
        {messages.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Estudando <strong>{lessonTitle}</strong>. Escolha uma sugestão ou escreva sua
              pergunta.
            </p>
            <div className="flex flex-col gap-2">
              {PROFESSOR_SUGGESTIONS.map((suggestion) => (
                <Button
                  key={suggestion.mode}
                  variant="outline"
                  size="sm"
                  className="h-auto justify-start py-2 text-left whitespace-normal"
                  disabled={busy}
                  onClick={() => ask(suggestion.label)}
                >
                  {suggestion.label}
                </Button>
              ))}
            </div>
          </div>
        ) : null}

        {messages.map((message) => {
          const text = message.parts
            .map((part) => (part.type === "text" ? part.text : ""))
            .join("");
          const mine = message.role === "user";
          if (!text) return null;
          return (
            <div key={message.id} className={mine ? "flex justify-end" : "flex justify-start"}>
              <div
                className={
                  mine
                    ? "max-w-[85%] rounded-2xl bg-primary px-4 py-3 text-sm text-primary-foreground"
                    : "max-w-[90%] rounded-2xl border border-border/60 bg-card px-4 py-3"
                }
              >
                {mine ? text : <MarkdownContent>{text}</MarkdownContent>}
                {!mine && !busy ? (
                  <ProfessorAnswerAudio messageId={message.id} text={text} />
                ) : null}
              </div>
            </div>
          );
        })}


        {status === "submitted" ? (
          <p className="text-sm text-muted-foreground">{PROFESSOR_IA_LOADING}</p>
        ) : null}

        {errorMessage ? (
          <div className="space-y-2 rounded-xl bg-destructive/10 p-3">
            <p className="text-sm text-destructive">{errorMessage}</p>
            <Button size="sm" variant="outline" onClick={() => setFailed(false)}>
              Entendi
            </Button>
          </div>
        ) : null}

        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border/60 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {emptyWarning ? (
          <p className="mb-2 text-xs text-muted-foreground">Escreva uma pergunta para enviar.</p>
        ) : null}
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                ask(input);
                setInput("");
              }
            }}
            rows={2}
            placeholder="Digite sua pergunta..."
            className="min-h-11 resize-none"
          />
          <Button
            size="icon"
            aria-label="Perguntar"
            disabled={busy}
            onClick={() => {
              ask(input);
              if (input.trim()) setInput("");
            }}
          >
            <Send className="size-4" aria-hidden />
          </Button>
        </div>
      </div>
    </>
  );
}
