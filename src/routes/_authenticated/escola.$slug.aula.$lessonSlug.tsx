import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Clock, Lock } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { completeLesson, getStudentLesson } from "@/lib/school-catalog.functions";
import { LESSON_SECTIONS, percentOf, sectionLabel } from "@/lib/school/lesson-view";

export const Route = createFileRoute("/_authenticated/escola/$slug/aula/$lessonSlug")({
  head: () => ({
    meta: [
      { title: "Aula — Escola Bíblica | Caminhando com Cristo" },
      {
        name: "description",
        content:
          "Estude a aula com leitura confortável, referências bíblicas destacadas e aplicação prática.",
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
  const queryClient = useQueryClient();
  const router = useRouter();

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
            ) : data.blocks.length ? (
              <div className="space-y-4">
                {data.blocks.map((block) => (
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
                          <span
                            key={ref}
                            className="font-scripture text-sm font-medium text-primary"
                          >
                            {ref}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="space-y-3 p-5">
                <p className="text-sm text-muted-foreground">
                  O conteúdo desta aula está sendo preparado. A estrutura de estudo seguirá esta
                  ordem:
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

            {!data.locked ? (
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
            ) : null}

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
