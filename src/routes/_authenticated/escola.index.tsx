import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, BookMarked, GraduationCap, Lock, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { listCatalog } from "@/lib/school-catalog.functions";
import { COURSE_LEVELS, levelLabel } from "@/lib/school/types";
import type { CatalogCourse } from "@/lib/school/admin-types";

export const Route = createFileRoute("/_authenticated/escola/")({
  head: () => ({
    meta: [
      { title: "Escola Bíblica — Caminhando com Cristo" },
      {
        name: "description",
        content:
          "Cursos para aprender a compreender as Escrituras de maneira simples, profunda e responsável.",
      },
      { property: "og:title", content: "Escola Bíblica" },
      {
        property: "og:description",
        content: "Estude a Bíblia com cursos organizados por nível, do iniciante ao profundo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EscolaPage,
});

function CourseCard({ course }: { course: CatalogCourse }) {
  const percent = course.lessons ? Math.round((course.completedLessons / course.lessons) * 100) : 0;
  const started = course.completedLessons > 0;
  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{levelLabel(course.level)}</Badge>
        <Badge variant={course.tier === "premium" ? "default" : "outline"}>
          {course.tier === "premium" ? (
            <>
              <Lock className="mr-1 size-3" /> Premium
            </>
          ) : (
            "Gratuito"
          )}
        </Badge>
      </div>
      <div>
        <h3 className="font-display text-lg font-semibold">{course.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{course.subtitle ?? course.description}</p>
      </div>
      <p className="text-xs text-muted-foreground">
        {course.modules} módulo(s) · {course.lessons} aula(s)
      </p>
      {started ? (
        <div className="space-y-1">
          <Progress value={percent} />
          <p className="text-xs text-muted-foreground">{percent}% concluído</p>
        </div>
      ) : null}
      <Button asChild className="mt-auto w-full">
        <Link to="/escola/$slug" params={{ slug: course.slug }}>
          {started ? "Continuar curso" : "Começar curso"}
          <ArrowRight className="ml-1 size-4" />
        </Link>
      </Button>
    </Card>
  );
}

function EscolaPage() {
  const fetchCatalog = useServerFn(listCatalog);
  const { data: courses, isLoading } = useQuery({
    queryKey: ["school-catalog"],
    queryFn: () => fetchCatalog(),
  });
  const [level, setLevel] = useState<string>("todos");
  const [tier, setTier] = useState<string>("todos");

  const list = (courses ?? []).filter(
    (c) => (level === "todos" || c.level === level) && (tier === "todos" || c.tier === tier),
  );
  const continuing = (courses ?? []).filter((c) => c.completedLessons > 0);

  return (
    <AppShell
      title="Escola Bíblica"
      subtitle="Aprenda a compreender as Escrituras de maneira simples, profunda e responsável."
    >
      <div className="space-y-6">
        <Card className="flex items-start gap-3 bg-primary/5 p-5">
          <GraduationCap className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
          <p className="text-sm text-muted-foreground">
            Você não precisa saber teologia para começar. Escolha um curso, siga as aulas no seu
            ritmo e deixe a Palavra formar o seu caminhar com Cristo.
          </p>
        </Card>

        <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold">Continuar estudando</h2>
          {continuing.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {continuing.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Quando você começar um curso, ele aparecerá aqui para retomar de onde parou.
            </p>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold">Cursos disponíveis</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={level === "todos" ? "default" : "outline"}
              onClick={() => setLevel("todos")}
            >
              Todos os níveis
            </Button>
            {COURSE_LEVELS.map((l) => (
              <Button
                key={l.key}
                size="sm"
                variant={level === l.key ? "default" : "outline"}
                onClick={() => setLevel(l.key)}
              >
                {l.label}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { key: "todos", label: "Todo o acesso" },
              { key: "free", label: "Gratuitos" },
              { key: "premium", label: "Premium" },
            ].map((option) => (
              <Button
                key={option.key}
                size="sm"
                variant={tier === option.key ? "secondary" : "ghost"}
                onClick={() => setTier(option.key)}
              >
                {option.label}
              </Button>
            ))}
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando cursos…</p>
          ) : list.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {list.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <Card className="flex items-start gap-3 p-5">
              <BookMarked className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
              <p className="text-sm text-muted-foreground">
                Os primeiros cursos estão sendo preparados com cuidado. Em breve você poderá
                começar sua jornada de estudo aqui.
              </p>
            </Card>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold">Recomendados para você</h2>
          <Card className="flex items-start gap-3 p-5">
            <Sparkles className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
            <p className="text-sm text-muted-foreground">
              Em breve a Escola Bíblica sugerirá cursos com base nos seus interesses e no seu
              progresso.
            </p>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
