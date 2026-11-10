import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Lock } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LessonAudioPlayer } from "@/components/school/LessonAudioPlayer";
import { LessonNarrationPlayer } from "@/components/school/LessonNarrationPlayer";
import { LessonWorkspace } from "@/components/school/LessonWorkspace";
import { completeLesson, getStudentLesson, saveLessonCheckpoint } from "@/lib/school-catalog.functions";
import { sectionLabel } from "@/lib/school/lesson-view";

export const Route = createFileRoute("/_authenticated/escola/$slug/aula/$lessonSlug")({
  head: () => ({ meta: [{ title: "Aula — Escola Bíblica | Caminho Divino" }] }),
  component: StudentLessonPage,
});

function StudentLessonPage() {
  const { slug, lessonSlug } = Route.useParams();
  const queryClient = useQueryClient();
  const fetchLesson = useServerFn(getStudentLesson);
  const saveCheckpoint = useServerFn(saveLessonCheckpoint);
  const finishLesson = useServerFn(completeLesson);
  const query = useQuery({
    queryKey: ["student-lesson", slug, lessonSlug],
    queryFn: () => fetchLesson({ data: { slug, lessonSlug } }),
  });

  const checkpointMutation = useMutation({
    mutationFn: (value: {
      readPercent?: number;
      audioPositionSeconds?: number;
      lastSectionIndex?: number;
      audioChunkIndex?: number;
      playbackRate?: number;
    }) => {
      if (!query.data) throw new Error("Aula indisponível.");
      return saveCheckpoint({ data: { lessonId: query.data.lesson.id, ...value } });
    },
    onError: () => toast.error("Não foi possível salvar seu progresso agora."),
  });
  const completeMutation = useMutation({
    mutationFn: () => {
      if (!query.data) throw new Error("Aula indisponível.");
      return finishLesson({ data: { lessonId: query.data.lesson.id } });
    },
    onSuccess: () => {
      toast.success("Aula concluída! Seu progresso foi atualizado.");
      queryClient.invalidateQueries({ queryKey: ["student-lesson", slug, lessonSlug] });
      queryClient.invalidateQueries({ queryKey: ["student-course", slug] });
      queryClient.invalidateQueries({ queryKey: ["school-catalog"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const view = query.data;
  const progressPercent = view?.totalLessons ? Math.round((view.completedLessons / view.totalLessons) * 100) : 0;

  return (
    <AppShell title={view?.lesson.title ?? "Aula"} subtitle={view ? `${view.course.title} · ${view.module.title}` : "Escola Bíblica"}>
      <div className="space-y-5">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/escola/$slug" params={{ slug }}><ArrowLeft className="mr-1 size-4" /> Voltar ao curso</Link>
        </Button>

        {query.isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando aula…</p>
        ) : query.isError ? (
          <Card className="space-y-3 p-5">
            <h2 className="font-semibold">Não foi possível carregar esta aula</h2>
            <p className="text-sm text-muted-foreground">{query.error instanceof Error ? query.error.message : "Tente novamente."}</p>
            <Button size="sm" variant="outline" onClick={() => query.refetch()}>Tentar novamente</Button>
          </Card>
        ) : !view ? (
          <Card className="space-y-3 p-5">
            <h2 className="font-display text-lg font-semibold">Aula não encontrada ou não publicada</h2>
            <p className="text-sm text-muted-foreground">Esta aula não está disponível neste curso.</p>
            <Button asChild variant="outline" size="sm"><Link to="/escola/$slug" params={{ slug }}>Voltar ao curso</Link></Button>
          </Card>
        ) : (
          <>
            <Card className="space-y-4 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">Módulo {view.module.position}</Badge>
                <Badge variant="outline">{view.lesson.tier === "premium" ? "Premium" : "Gratuito"}</Badge>
                {view.status === "concluida" ? <Badge><CheckCircle2 className="mr-1 size-3" /> Concluída</Badge> : null}
              </div>
              <div>
                <h1 className="font-display text-2xl font-semibold">{view.lesson.title}</h1>
                {view.lesson.summary ? <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{view.lesson.summary}</p> : null}
                {view.lesson.passage ? <p className="mt-3 text-sm font-medium text-primary">{view.lesson.passage}</p> : null}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progresso do curso</span>
                  <span>{view.completedLessons}/{view.totalLessons} aulas · {progressPercent}%</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>
              {view.locked ? (
                <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
                  <Lock className="mt-0.5 size-5 shrink-0 text-amber-600" />
                  <div>
                    <p className="font-semibold">Conteúdo Premium</p>
                    <p className="text-sm text-muted-foreground">Esta aula exige acesso Premium. O conteúdo permanece protegido.</p>
                  </div>
                </div>
              ) : null}
            </Card>

            {!view.locked ? (
              <>
                {view.audio ? (
                  <LessonAudioPlayer
                    src={view.audio.url}
                    title={view.audio.title ?? view.lesson.title}
                    startAt={view.resume.audioPositionSeconds}
                    fallbackDuration={view.audio.duration_seconds}
                    onPosition={(seconds) => checkpointMutation.mutate({ audioPositionSeconds: seconds })}
                  />
                ) : view.blocks.length ? (
                  <LessonNarrationPlayer
                    title={view.lesson.title}
                    blocks={view.blocks}
                    initialChunkIndex={view.resume.audioChunkIndex}
                    initialRate={view.resume.playbackRate}
                    onCheckpoint={(value) => checkpointMutation.mutate(value)}
                  />
                ) : null}

                {view.video ? (
                  <Card className="space-y-2 p-4">
                    <h2 className="font-semibold">{view.video.title ?? "Videoaula"}</h2>
                    <a href={view.video.url} target="_blank" rel="noreferrer" className="text-sm text-primary underline">Abrir vídeo</a>
                  </Card>
                ) : null}

                {view.blocks.length ? (
                  <div className="space-y-4">
                    {view.blocks.map((block, index) => (
                      <Card key={block.id} className="space-y-3 p-5">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">{sectionLabel(block.kind)}</Badge>
                          <span className="text-xs text-muted-foreground">Seção {index + 1}</span>
                        </div>
                        {block.title ? <h2 className="font-display text-lg font-semibold">{block.title}</h2> : null}
                        <p className="whitespace-pre-wrap text-sm leading-7">{block.body}</p>
                        {block.scripture_refs.length ? (
                          <div className="flex flex-wrap gap-2 border-t pt-3">
                            {block.scripture_refs.map((reference) => <Badge key={reference} variant="secondary">{reference}</Badge>)}
                          </div>
                        ) : null}
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="flex flex-col items-center gap-3 p-8 text-center">
                    <BookOpen className="size-7 text-muted-foreground" />
                    <h2 className="font-semibold">Conteúdo desta aula em preparação</h2>
                    <p className="text-sm text-muted-foreground">O módulo foi publicado, mas ainda não há blocos de conteúdo cadastrados.</p>
                  </Card>
                )}

                {view.questions.length ? (
                  <Card className="space-y-4 p-5">
                    <h2 className="font-display text-lg font-semibold">Questões para revisar</h2>
                    {view.questions.map((question, index) => (
                      <div key={question.id} className="space-y-2 border-t pt-3">
                        <p className="font-medium">{index + 1}. {question.prompt}</p>
                        {question.options.length ? <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">{question.options.map((option) => <li key={option}>{option}</li>)}</ul> : null}
                        {question.explanation ? <p className="text-sm text-muted-foreground">{question.explanation}</p> : null}
                        {question.scripture_refs.length ? <p className="text-xs text-primary">{question.scripture_refs.join(" · ")}</p> : null}
                      </div>
                    ))}
                  </Card>
                ) : null}

                <LessonWorkspace lessonId={view.lesson.id} courseId={view.course.id} lessonTitle={view.lesson.title} passage={view.lesson.passage} />

                <Button className="w-full sm:w-auto" onClick={() => completeMutation.mutate()} disabled={completeMutation.isPending || view.status === "concluida"}>
                  <CheckCircle2 className="mr-2 size-4" />
                  {view.status === "concluida" ? "Aula concluída" : completeMutation.isPending ? "Salvando conclusão…" : "Marcar aula como concluída"}
                </Button>
              </>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              {view.prev ? (
                <Button asChild variant="outline" size="sm"><Link to="/escola/$slug/aula/$lessonSlug" params={{ slug, lessonSlug: view.prev.slug }}><ArrowLeft className="mr-1 size-4" /> Aula anterior</Link></Button>
              ) : <span />}
              {view.next ? (
                <Button asChild size="sm"><Link to="/escola/$slug/aula/$lessonSlug" params={{ slug, lessonSlug: view.next.slug }}>Próxima aula <ArrowRight className="ml-1 size-4" /></Link></Button>
              ) : null}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
