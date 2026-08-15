import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Headphones,
  Lock,
  ScrollText,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LessonAudioPlayer } from "@/components/school/LessonAudioPlayer";
import {
  completeLesson,
  getStudentLesson,
  saveLessonCheckpoint,
} from "@/lib/school-catalog.functions";
import {
  HIGHLIGHT_KIND,
  LESSON_SECTIONS,
  percentOf,
  sectionLabel,
} from "@/lib/school/lesson-view";

export const Route = createFileRoute("/_authenticated/escola/$slug/aula/$lessonSlug")({
  head: () => ({
    meta: [
      { title: "Aula — Escola Bíblica | Caminhando com Cristo" },
      {
        name: "description",
        content:
          "Estude a aula com leitura confortável, narração em áudio, referências bíblicas destacadas e aplicação prática.",
      },
      { property: "og:title", content: "Aula da Escola Bíblica" },
      {
        property: "og:description",
        content: "Conteúdo, reflexão, exercício e oração para aprofundar seu estudo bíblico.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LessonPage,
});

function LessonPage() {
  const { slug, lessonSlug } = Route.useParams();
  const fetchLesson = useServerFn(getStudentLesson);
  const markComplete = useServerFn(completeLesson);
  const saveCheckpoint = useServerFn(saveLessonCheckpoint);
  const queryClient = useQueryClient();
  const router = useRouter();
  const [mode, setMode] = useState<"ler" | "ouvir">("ler");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["school-lesson", slug, lessonSlug],
    queryFn: () => fetchLesson({ data: { slug, lessonSlug } }),
  });

  const complete = useMutation({
    mutationFn: (lessonId: string) => markComplete({ data: { lessonId } }),
    onSuccess: (result) => {
      toast.success(`Aula concluída! ${result.percent}% do curso.`);
      queryClient.invalidateQueries({ queryKey: ["school-lesson"] });
      queryClient.invalidateQueries({ queryKey: ["school-course"] });
      queryClient.invalidateQueries({ queryKey: ["school-catalog"] });
      void router.invalidate();
    },
    onError: (error: Error) => toast.error(error.message || "Não foi possível concluir a aula."),
  });

  const lessonId = data?.locked ? null : (data?.lesson.id ?? null);
  const readPercentRef = useRef(0);
  const audioPositionRef = useRef<number | null>(null);

  // Registro simples de progresso: percentual lido + posição do áudio.
  useEffect(() => {
    if (!lessonId) return;
    const onScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const percent = scrollable > 0 ? Math.round((window.scrollY / scrollable) * 100) : 100;
      readPercentRef.current = Math.max(readPercentRef.current, Math.min(100, Math.max(0, percent)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const flush = () => {
      const readPercent = readPercentRef.current;
      const audioPositionSeconds = audioPositionRef.current;
      if (readPercent === 0 && audioPositionSeconds === null) return;
      void saveCheckpoint({
        data: {
          lessonId,
          readPercent,
          ...(audioPositionSeconds !== null ? { audioPositionSeconds } : {}),
        },
      }).catch(() => undefined);
    };
    const timer = window.setInterval(flush, 20000);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearInterval(timer);
      flush();
    };
  }, [lessonId, saveCheckpoint]);

  return (
    <AppShell
      title={data?.lesson.title ?? "Aula"}
      subtitle={data ? `${data.course.title} · Módulo ${data.module.position}` : "Escola Bíblica"}
    >
      <div className="mx-auto w-full max-w-2xl space-y-5">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/escola/$slug" params={{ slug }}>
            <ArrowLeft className="mr-1 size-4" /> Voltar ao curso
          </Link>
        </Button>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando aula…</p>
        ) : isError ? (
          <Card className="space-y-3 p-5 text-sm text-muted-foreground">
            <p>Não foi possível carregar a aula. Tente novamente.</p>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </Card>
        ) : !data ? (
          <Card className="p-5 text-sm text-muted-foreground">
            Esta aula não está disponível no momento.
          </Card>
        ) : (
          <>
            <Card className="space-y-3 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  Módulo {data.module.position} · Aula {data.lesson.position}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Clock className="size-3" /> {data.lesson.duration_minutes} min
                </Badge>
                {data.status === "concluida" ? (
                  <Badge className="gap-1">
                    <CheckCircle2 className="size-3" /> Concluída
                  </Badge>
                ) : null}
              </div>
              <h1 className="font-display text-xl leading-snug font-semibold">
                {data.lesson.title}
              </h1>
              <p className="text-sm leading-relaxed text-muted-foreground">{data.lesson.summary}</p>
              <div className="space-y-1">
                <Progress value={percentOf(data.completedLessons, data.totalLessons)} />
                <p className="text-xs text-muted-foreground">
                  {data.completedLessons} de {data.totalLessons} aulas concluídas no curso
                </p>
              </div>
              {!data.locked && data.status !== "concluida" && data.resume.readPercent > 5 ? (
                <p className="rounded-lg bg-primary/5 p-3 text-xs text-muted-foreground">
                  Você estava em {data.resume.readPercent}% desta aula. Continue de onde parou.
                </p>
              ) : null}
            </Card>

            {data.locked ? (
              <Card className="flex items-start gap-3 p-5">
                <Lock className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                <div className="space-y-1 text-sm">
                  <p className="font-medium">Conteúdo Premium</p>
                  <p className="text-muted-foreground">
                    Esta aula faz parte do conteúdo Premium da Escola Bíblica. Em breve você poderá
                    liberar o acesso completo.
                  </p>
                </div>
              </Card>
            ) : (
              <>
                <Tabs value={mode} onValueChange={(value) => setMode(value as "ler" | "ouvir")}>
                  <TabsList className="w-full">
                    <TabsTrigger value="ouvir" className="flex-1 gap-1.5">
                      <Headphones className="size-4" aria-hidden /> Ouvir aula
                    </TabsTrigger>
                    <TabsTrigger value="ler" className="flex-1 gap-1.5">
                      <ScrollText className="size-4" aria-hidden /> Ler aula
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="ouvir" className="mt-4">
                    {data.audio ? (
                      <LessonAudioPlayer
                        src={data.audio.url}
                        title={data.lesson.title}
                        startAt={data.resume.audioPositionSeconds}
                        fallbackDuration={data.audio.duration_seconds}
                        onPosition={(seconds) => {
                          audioPositionRef.current = seconds;
                        }}
                      />
                    ) : (
                      <Card className="space-y-2 p-5">
                        <div className="flex items-center gap-2">
                          <Headphones className="size-4 text-primary" aria-hidden />
                          <h2 className="font-display text-base font-semibold">Ouvir esta aula</h2>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {data.hasNarrationScript
                            ? "O roteiro de narração desta aula já está pronto. A narração em áudio será disponibilizada aqui em breve, com controles de velocidade e retomada do ponto onde você parou."
                            : "A narração em áudio desta aula está sendo preparada e aparecerá aqui quando estiver disponível."}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Enquanto isso, você pode acompanhar a aula na aba{" "}
                          <strong>Ler aula</strong>.
                        </p>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="ler" className="mt-4 space-y-4">
                    {data.blocks.length ? (
                      data.blocks.map((block) =>
                        block.kind === HIGHLIGHT_KIND ? (
                          <Card
                            key={block.id}
                            className="space-y-2 border-l-4 border-l-primary bg-primary/5 p-5"
                          >
                            <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                              {block.title ?? sectionLabel(block.kind)}
                            </p>
                            <blockquote className="font-display text-lg leading-relaxed font-semibold text-foreground">
                              {block.body
                                .split(/\n{2,}/)
                                .filter(Boolean)
                                .map((paragraph, index) => (
                                  <p key={index} className={index > 0 ? "mt-2" : undefined}>
                                    {paragraph}
                                  </p>
                                ))}
                            </blockquote>
                          </Card>
                        ) : (
                          <Card key={block.id} className="space-y-3 p-5">
                            <h2 className="font-display text-base font-semibold">
                              {block.title ?? sectionLabel(block.kind)}
                            </h2>
                            <div className="space-y-3 text-[15px] leading-7 text-foreground/90">
                              {block.body
                                .split(/\n{2,}/)
                                .filter(Boolean)
                                .map((paragraph, index) => (
                                  <p key={index}>{paragraph}</p>
                                ))}
                            </div>
                            {block.scripture_refs.length ? (
                              <div className="flex flex-wrap items-center gap-2 rounded-xl bg-primary/5 p-3">
                                <BookOpen className="size-4 shrink-0 text-primary" aria-hidden />
                                {block.scripture_refs.map((ref) => (
                                  <span key={ref} className="text-sm font-medium text-primary">
                                    {ref}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </Card>
                        ),
                      )
                    ) : (
                      <Card className="space-y-3 p-5">
                        <p className="text-sm text-muted-foreground">
                          O conteúdo desta aula está sendo preparado. A estrutura de estudo seguirá
                          esta ordem:
                        </p>
                        <ol className="grid gap-1.5 text-sm text-muted-foreground sm:grid-cols-2">
                          {LESSON_SECTIONS.map((section, index) => (
                            <li key={section.kind}>
                              {index + 1}. {section.label}
                            </li>
                          ))}
                        </ol>
                      </Card>
                    )}
                  </TabsContent>
                </Tabs>

                {data.questions.length ? <LessonQuiz questions={data.questions} /> : null}

                <Button
                  className="w-full"
                  disabled={complete.isPending || data.status === "concluida"}
                  onClick={() => complete.mutate(data.lesson.id)}
                >
                  {data.status === "concluida"
                    ? "Aula concluída"
                    : complete.isPending
                      ? "Salvando…"
                      : "Marcar aula como concluída"}
                </Button>
              </>
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
              {data.prev ? (
                <Button asChild variant="outline" className="justify-start">
                  <Link
                    to="/escola/$slug/aula/$lessonSlug"
                    params={{ slug, lessonSlug: data.prev.slug }}
                  >
                    <ArrowLeft className="mr-1 size-4" /> Aula anterior
                  </Link>
                </Button>
              ) : null}
              {data.next ? (
                <Button asChild className="justify-end sm:ml-auto">
                  <Link
                    to="/escola/$slug/aula/$lessonSlug"
                    params={{ slug, lessonSlug: data.next.slug }}
                  >
                    Próxima aula <ArrowRight className="ml-1 size-4" />
                  </Link>
                </Button>
              ) : null}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

type QuizQuestion = {
  id: string;
  kind: string;
  prompt: string;
  options: string[];
  explanation: string | null;
  scripture_refs: string[];
};

function LessonQuiz({ questions }: { questions: QuizQuestion[] }) {
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  return (
    <Card className="space-y-4 p-5">
      <h2 className="font-display text-base font-semibold">Questionário da aula</h2>
      <p className="text-sm text-muted-foreground">
        Responda mentalmente ou no seu diário e confira a explicação bíblica.
      </p>
      <ol className="space-y-4">
        {questions.map((question, index) => (
          <li key={question.id} className="space-y-2">
            <p className="text-sm font-medium">
              {index + 1}. {question.prompt}
            </p>
            {question.options.length ? (
              <ul className="space-y-1 text-sm text-muted-foreground">
                {question.options.map((option) => (
                  <li key={option} className="rounded-lg border border-border/60 px-3 py-2">
                    {option}
                  </li>
                ))}
              </ul>
            ) : null}
            {question.explanation ? (
              revealed[question.id] ? (
                <div className="space-y-2 rounded-xl bg-primary/5 p-3 text-sm">
                  <p>{question.explanation}</p>
                  {question.scripture_refs.length ? (
                    <p className="text-xs font-medium text-primary">
                      {question.scripture_refs.join(" · ")}
                    </p>
                  ) : null}
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRevealed((prev) => ({ ...prev, [question.id]: true }))}
                >
                  Ver explicação
                </Button>
              )
            ) : null}
          </li>
        ))}
      </ol>
    </Card>
  );
}
