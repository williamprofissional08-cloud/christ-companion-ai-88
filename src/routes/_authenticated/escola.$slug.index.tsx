import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, CheckCircle2, Lock, PlayCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getStudentCourse } from "@/lib/school-catalog.functions";
import { levelLabel } from "@/lib/school/types";

export const Route = createFileRoute("/_authenticated/escola/$slug/")({
  head: () => ({ meta: [{ title: "Curso — Escola Bíblica | Caminho Divino" }] }),
  component: StudentCoursePage,
});

function StudentCoursePage() {
  const { slug } = Route.useParams();
  const fetchCourse = useServerFn(getStudentCourse);
  const query = useQuery({
    queryKey: ["student-course", slug],
    queryFn: () => fetchCourse({ data: { slug } }),
  });
  const course = query.data;

  return (
    <AppShell title={course?.course.title ?? "Escola Bíblica"} subtitle={course?.course.subtitle ?? "Detalhes do curso"}>
      <div className="space-y-5">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/escola"><ArrowLeft className="mr-1 size-4" /> Escola Bíblica</Link>
        </Button>

        {query.isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando curso…</p>
        ) : query.isError ? (
          <Card className="space-y-3 p-5">
            <h2 className="font-semibold">Não foi possível carregar este curso</h2>
            <p className="text-sm text-muted-foreground">{query.error instanceof Error ? query.error.message : "Tente novamente."}</p>
            <Button size="sm" variant="outline" onClick={() => query.refetch()}>Tentar novamente</Button>
          </Card>
        ) : !course ? (
          <Card className="space-y-3 p-5">
            <h2 className="font-display text-lg font-semibold">Curso não encontrado ou ainda não publicado</h2>
            <p className="text-sm text-muted-foreground">Este curso não está disponível no catálogo público.</p>
            <Button asChild variant="outline" size="sm"><Link to="/escola">Voltar aos cursos</Link></Button>
          </Card>
        ) : (
          <>
            <Card className="space-y-4 p-5">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{levelLabel(course.course.level)}</Badge>
                <Badge variant="outline">{course.course.tier === "premium" ? "Premium" : "Gratuito"}</Badge>
              </div>
              <div>
                <h1 className="font-display text-2xl font-semibold">{course.course.title}</h1>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{course.course.description}</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Seu progresso</span>
                  <span>{course.completedLessons}/{course.totalLessons} aulas · {course.percent}%</span>
                </div>
                <Progress value={course.percent} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {course.completedChapters}/{course.totalChapters} capítulos concluídos
                </p>
              </div>
              {course.nextLessonSlug ? (
                <Button asChild size="sm">
                  <Link to="/escola/$slug/aula/$lessonSlug" params={{ slug, lessonSlug: course.nextLessonSlug }}>
                    Continuar estudando
                  </Link>
                </Button>
              ) : null}
            </Card>

            {course.modules.length === 0 ? (
              <Card className="flex flex-col items-center gap-3 p-8 text-center">
                <BookOpen className="size-7 text-muted-foreground" aria-hidden />
                <h2 className="font-semibold">Módulos em preparação</h2>
                <p className="text-sm text-muted-foreground">Este curso foi cadastrado, mas ainda não possui módulos publicados.</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {course.modules.map((module) => {
                  const chapterLessonIds = new Set(module.chapters.flatMap((chapter) => chapter.lessons.map((lesson) => lesson.id)));
                  const ungrouped = module.lessons.filter((lesson) => !chapterLessonIds.has(lesson.id));
                  return (
                    <Card key={module.id} className="space-y-4 p-5">
                      <div>
                        <p className="text-xs text-muted-foreground">Módulo {module.order_index}</p>
                        <h2 className="font-display text-lg font-semibold">{module.title}</h2>
                        {module.summary ? <p className="mt-1 text-sm text-muted-foreground">{module.summary}</p> : null}
                      </div>
                      {module.chapters.map((chapter) => (
                        <section key={chapter.id} className="space-y-2 border-t pt-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className="font-semibold">{chapter.title || `Capítulo ${chapter.chapter_number}`}</h3>
                            <Badge variant="outline">{chapter.status === "concluido" ? "Concluído" : chapter.status === "em_andamento" ? "Em andamento" : "Não iniciado"}</Badge>
                          </div>
                          {chapter.lessons.map((lesson) => (
                            <LessonRow key={lesson.id} slug={slug} lessonSlug={lesson.slug} title={lesson.title} summary={lesson.summary} duration={lesson.duration_minutes} completed={lesson.completed} locked={lesson.locked} />
                          ))}
                          {chapter.lessons.length === 0 ? <p className="text-xs text-muted-foreground">Nenhuma aula publicada neste capítulo.</p> : null}
                        </section>
                      ))}
                      {ungrouped.length ? (
                        <section className="space-y-2 border-t pt-3">
                          <h3 className="font-semibold">Aulas do módulo</h3>
                          {ungrouped.map((lesson) => (
                            <LessonRow key={lesson.id} slug={slug} lessonSlug={lesson.slug} title={lesson.title} summary={lesson.summary} duration={lesson.duration_minutes} completed={lesson.completed} locked={lesson.locked} />
                          ))}
                        </section>
                      ) : null}
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

function LessonRow({ slug, lessonSlug, title, summary, duration, completed, locked }: {
  slug: string; lessonSlug: string; title: string; summary: string; duration: number; completed: boolean; locked: boolean;
}) {
  return (
    <Link to="/escola/$slug/aula/$lessonSlug" params={{ slug, lessonSlug }} className="flex items-start gap-3 rounded-lg border border-border/60 p-3 transition-colors hover:bg-muted/40">
      <span className="mt-0.5 text-primary">
        {locked ? <Lock className="size-4" /> : completed ? <CheckCircle2 className="size-4" /> : <PlayCircle className="size-4" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{title}</span>
        {summary ? <span className="mt-1 line-clamp-2 block text-xs text-muted-foreground">{summary}</span> : null}
      </span>
      <span className="shrink-0 text-xs text-muted-foreground">{duration} min</span>
    </Link>
  );
}
