import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock, Lock } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCatalogCourse } from "@/lib/school-catalog.functions";
import { levelLabel } from "@/lib/school/types";

export const Route = createFileRoute("/_authenticated/escola/$slug")({
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
  const fetchCourse = useServerFn(getCatalogCourse);
  const { data, isLoading } = useQuery({
    queryKey: ["school-course", slug],
    queryFn: () => fetchCourse({ data: { slug } }),
  });

  const course = data?.course;

  return (
    <AppShell title={course?.title ?? "Curso"} subtitle={course?.subtitle ?? "Escola Bíblica"}>
      <div className="space-y-5">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/escola">
            <ArrowLeft className="mr-1 size-4" /> Escola Bíblica
          </Link>
        </Button>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando curso…</p>
        ) : !course ? (
          <Card className="p-5 text-sm text-muted-foreground">
            Este curso não está disponível no momento.
          </Card>
        ) : (
          <>
            <Card className="space-y-3 p-5">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{levelLabel(course.level)}</Badge>
                <Badge variant={course.tier === "premium" ? "default" : "outline"}>
                  {course.tier === "premium" ? "Premium" : "Gratuito"}
                </Badge>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{course.description}</p>
            </Card>

            {(data?.modules ?? []).length ? (
              <div className="space-y-4">
                {(data?.modules ?? []).map((mod, index) => (
                  <Card key={mod.id} className="space-y-3 p-5">
                    <div>
                      <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                        Módulo {index + 1}
                      </p>
                      <h2 className="font-display text-lg font-semibold">{mod.title}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">{mod.summary}</p>
                    </div>
                    {mod.lessons.length ? (
                      <ul className="divide-y divide-border/70">
                        {mod.lessons.map((lesson) => (
                          <li key={lesson.id} className="flex items-center gap-3 py-2.5">
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{lesson.title}</p>
                              <p className="truncate text-xs text-muted-foreground">
                                {lesson.summary}
                              </p>
                            </div>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              {lesson.tier === "premium" ? <Lock className="size-3" /> : null}
                              <Clock className="size-3" /> {lesson.duration_minutes} min
                            </span>
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
