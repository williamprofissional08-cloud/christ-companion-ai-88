import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Award, BookOpen, CheckCircle2, Circle, Clock, FilePenLine, Lock, Search } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { getStudentCourse } from "@/lib/school-catalog.functions";
import { getPreacherCourseStats, issueCourseCertificate } from "@/lib/preacher-course.functions";
import { levelLabel } from "@/lib/school/types";
import { percentOf } from "@/lib/school/lesson-view";

export const Route = createFileRoute("/_authenticated/escola/$slug/")({
  head: () => ({
    meta: [
      { title: "Curso — Escola Bíblica | Caminhando com Cristo" },
      {
        name: "description",
        content: "Módulos e aulas do curso da Escola Bíblica, no seu ritmo.",
      },
      { property: "og:title", content: "Curso da Escola Bíblica" },
      { property: "og:description", content: "Estude a Bíblia com método e simplicidade." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CoursePage,
});

function CoursePage() {
  const { slug } = Route.useParams();
  const fetchCourse = useServerFn(getStudentCourse);
  const fetchStats = useServerFn(getPreacherCourseStats);
  const issueCertificate = useServerFn(issueCourseCertificate);
  const [search, setSearch] = useState("");
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["school-course", slug],
    queryFn: () => fetchCourse({ data: { slug } }),
  });

  const course = data?.course;
  const isPreacherCourse = slug === "formacao-de-pregadores";
  const stats = useQuery({
    queryKey: ["preacher-course-stats", course?.id],
    queryFn: () => fetchStats({ data: { courseId: course?.id ?? "" } }),
    enabled: isPreacherCourse && Boolean(course?.id),
  });
  const certificate = useMutation({
    mutationFn: () => issueCertificate({ data: { courseId: course?.id ?? "" } }),
    onSuccess: (result) => toast.success(`Certificado emitido: ${result.code}`),
    onError: (error: Error) => toast.error(error.message),
  });
  const visibleModules = useMemo(() => {
    if (!data) return [];
    const term = search.trim().toLocaleLowerCase("pt-BR");
    if (!term) return data.modules;
    return data.modules.filter((mod) =>
      [mod.title, mod.summary, mod.testament, mod.category, ...mod.lessons.flatMap((lesson) => [lesson.title, lesson.summary, lesson.passage, ...lesson.keywords])]
        .filter(Boolean)
        .some((value) => value?.toLocaleLowerCase("pt-BR").includes(term)),
    );
  }, [data, search]);

  return (
    <AppShell title={course?.title ?? "Curso"} subtitle={course?.subtitle ?? "Escola Bíblica"}>
      <div className="mx-auto w-full max-w-3xl space-y-5">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/escola">
            <ArrowLeft className="mr-1 size-4" /> Escola Bíblica
          </Link>
        </Button>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando curso…</p>
        ) : isError ? (
          <Card className="space-y-3 p-5 text-sm text-muted-foreground">
            <p>Não foi possível carregar o curso. Tente novamente.</p>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </Card>
        ) : !course || !data ? (
          <Card className="p-5 text-sm text-muted-foreground">
            Este curso não está disponível no momento.
          </Card>
        ) : (
          <>
            <Card className="space-y-4 p-5">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{levelLabel(course.level)}</Badge>
                <Badge variant={course.tier === "premium" ? "default" : "outline"}>
                  {course.tier === "premium" ? "Premium" : "Gratuito"}
                </Badge>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{course.description}</p>
              <p className="text-xs text-muted-foreground">
                {data.modules.length} módulo(s) · {data.totalLessons} aula(s)
              </p>
              {data.totalLessons ? (
                <div className="space-y-1">
                  <Progress value={data.percent} />
                  <p className="text-xs text-muted-foreground">
                    {data.percent}% concluído · {data.completedLessons} de {data.totalLessons} aulas
                  </p>
                </div>
              ) : null}
              {data.nextLessonSlug ? (
                <Button asChild className="w-full sm:w-auto">
                  <Link
                    to="/escola/$slug/aula/$lessonSlug"
                    params={{ slug: course.slug, lessonSlug: data.nextLessonSlug }}
                  >
                    {data.completedLessons ? "Continuar curso" : "Começar curso"}
                    <ArrowRight className="ml-1 size-4" />
                  </Link>
                </Button>
              ) : data.totalLessons ? (
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-sm font-medium text-primary">Você concluiu todas as aulas deste curso.</p>
                  <Button size="sm" onClick={() => certificate.mutate()} disabled={certificate.isPending}>
                    <Award className="mr-1 size-4" /> Emitir certificado
                  </Button>
                </div>
              ) : null}
            </Card>

            {isPreacherCourse ? (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Card className="p-4"><BookOpen className="size-5 text-primary" /><strong className="mt-2 block text-2xl">{stats.data?.studiedBooks ?? 0}/66</strong><span className="text-xs text-muted-foreground">livros estudados</span></Card>
                  <Card className="p-4"><Clock className="size-5 text-primary" /><strong className="mt-2 block text-2xl">{stats.data?.studyDays ?? 0}</strong><span className="text-xs text-muted-foreground">dias de estudo</span></Card>
                  <Card className="p-4"><FilePenLine className="size-5 text-primary" /><strong className="mt-2 block text-2xl">{stats.data?.messages ?? 0}</strong><span className="text-xs text-muted-foreground">mensagens preparadas</span></Card>
                </div>
                <div className="relative">
                  <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar livro, passagem, tema ou palavra-chave" className="pl-9" />
                </div>
              </>
            ) : null}

            {visibleModules.length ? (
              <div className="space-y-4">
                {visibleModules.map((mod) => (
                  <Card key={mod.id} className="space-y-3 p-5">
                    <div>
                      <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                        {mod.testament ? `${mod.testament} · ` : ""}Livro {mod.book_number ?? mod.order_index}
                      </p>
                      <h2 className="font-display text-lg font-semibold">{mod.title}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">{mod.summary}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {mod.lessons.length} aula(s) ·{" "}
                        {percentOf(mod.completedLessons, mod.lessons.length)}% concluído
                      </p>
                    </div>
                    {mod.lessons.length ? (
                      <ul className="divide-y divide-border/70">
                        {mod.lessons.map((lesson, lessonIndex) => (
                          <li key={lesson.id}>
                            <Link
                              to="/escola/$slug/aula/$lessonSlug"
                              params={{ slug: course.slug, lessonSlug: lesson.slug }}
                              className="flex items-center gap-3 py-2.5 transition-colors hover:text-primary"
                            >
                              {lesson.completed ? (
                                <CheckCircle2 className="size-4 shrink-0 text-primary" aria-hidden />
                              ) : (
                                <Circle
                                  className="size-4 shrink-0 text-muted-foreground"
                                  aria-hidden
                                />
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">
                                  Aula {lessonIndex + 1} — {lesson.title}
                                  {lesson.slug === data.nextLessonSlug ? (
                                    <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                                      Você está aqui
                                    </span>
                                  ) : null}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                  {lesson.passage ? `${lesson.passage} · ` : ""}{lesson.summary}
                                </p>
                              </div>
                              <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                                {lesson.locked ? <Lock className="size-3" /> : null}
                                <Clock className="size-3" /> {lesson.duration_minutes} min
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        As aulas deste módulo serão publicadas em breve.
                      </p>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-5 text-sm text-muted-foreground">
                Os módulos deste curso estão sendo preparados.
              </Card>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
