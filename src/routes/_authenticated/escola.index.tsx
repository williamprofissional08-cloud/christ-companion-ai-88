import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, GraduationCap, ArrowRight, Crown, LibraryBig } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listCatalog } from "@/lib/school-catalog.functions";
import { amIAdmin } from "@/lib/admin.functions";
import { levelLabel } from "@/lib/school/types";

export const Route = createFileRoute("/_authenticated/escola/")({
  head: () => ({
    meta: [
      { title: "Escola Bíblica — Caminho Divino" },
      { name: "description", content: "Cursos e estudos bíblicos do Caminho Divino." },
    ],
  }),
  component: EscolaPage,
});

function EscolaPage() {
  const fetchCatalog = useServerFn(listCatalog);
  const checkAdmin = useServerFn(amIAdmin);
  const catalog = useQuery({
    queryKey: ["school-catalog"],
    queryFn: () => fetchCatalog(),
    staleTime: 30_000,
  });
  const courses = catalog.data ?? [];
  const admin = useQuery({
    queryKey: ["am-i-admin"],
    queryFn: () => checkAdmin(),
    staleTime: 60_000,
  });

  return (
    <AppShell title="Escola Bíblica" subtitle="Aprenda as Escrituras com profundidade, contexto e fidelidade ao texto bíblico.">
      <div className="mx-auto w-full max-w-6xl space-y-7 sm:space-y-9">
        <header className="space-y-2 px-1 pt-1 sm:pt-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Caminho Divino · Aprendizado</p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Escola Bíblica</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Aprenda, aprofunde e viva a Palavra de Deus. Estudos com excelência para todas as fases da sua jornada.
          </p>
        </header>

        <Card className="overflow-hidden rounded-2xl border-amber-200/80 bg-gradient-to-br from-amber-50 to-yellow-50/60 p-5 shadow-sm dark:border-amber-900/60 dark:from-amber-950/40 dark:to-amber-900/10 sm:p-6">
          <div className="flex items-center gap-4">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-amber-200/60 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
              <img src="/images/bible-school-study.webp" alt="" aria-hidden="true" className="size-full object-cover" />
              <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center bg-amber-950/20"><Crown className="size-6 text-white drop-shadow" /></span>
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-lg font-semibold text-amber-950 dark:text-amber-100">Formação bíblica para crescer na fé</h2>
              <p className="mt-1 text-sm leading-relaxed text-amber-950/70 dark:text-amber-100/70">
                Cursos, módulos e aulas para compreender o contexto, interpretar com responsabilidade e aplicar as Escrituras.
              </p>
            </div>
            <GraduationCap className="ml-auto hidden size-9 shrink-0 text-amber-700/80 dark:text-amber-300/80 sm:block" aria-hidden />
          </div>
        </Card>

        {catalog.isLoading ? (
          <Card className="flex items-center gap-3 rounded-2xl p-5 text-sm text-muted-foreground" role="status">
            <BookOpen className="size-5 animate-pulse text-primary" aria-hidden />Carregando cursos publicados…
          </Card>
        ) : catalog.isError ? (
          <Card className="space-y-3 p-5">
            <h2 className="font-semibold">Não foi possível carregar a Escola Bíblica</h2>
            <p className="text-sm text-muted-foreground">
              {catalog.error instanceof Error ? catalog.error.message : "Tente novamente em instantes."}
            </p>
            <Button variant="outline" size="sm" onClick={() => catalog.refetch()}>Tentar novamente</Button>
          </Card>
        ) : courses.length === 0 ? (
          <Card className="mx-auto flex max-w-3xl flex-col items-center gap-4 rounded-2xl border-dashed px-6 py-10 text-center sm:py-14">
            <div className="rounded-2xl bg-primary/10 p-4 text-primary">
              <LibraryBig className="size-8" aria-hidden />
            </div>
            <Badge variant="secondary">Catálogo em preparação</Badge>
            <h2 className="font-display text-xl font-semibold">Nenhum curso publicado no momento</h2>
            <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
              Os cursos ainda não foram cadastrados. Os estudos bíblicos por capítulo continuam
              na Jornada Bíblica; quando um curso estiver pronto e publicado, ele aparecerá aqui.
            </p>
            {admin.data ? (
              <Button asChild>
                <Link to="/admin/cursos">Gerenciar cursos <ArrowRight className="ml-2 size-4" /></Link>
              </Button>
            ) : null}
          </Card>
        ) : (
          <section className="space-y-4" aria-labelledby="courses-heading">
            <div className="flex items-end justify-between gap-3 border-b pb-3">
              <div>
                <h2 id="courses-heading" className="font-display text-xl font-semibold sm:text-2xl">Cursos disponíveis</h2>
                <p className="mt-1 text-sm text-muted-foreground">{courses.length} curso(s) publicado(s)</p>
              </div>
              {admin.data ? (
                <Button asChild size="sm" variant="outline"><Link to="/admin/cursos">Administrar</Link></Button>
              ) : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {courses.map((course) => (
                <Link key={course.id} to="/escola/$slug" params={{ slug: course.slug }} className="block">
                  <Card className="h-full space-y-4 rounded-2xl border-border/70 p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{levelLabel(course.level)}</Badge>
                      <Badge variant="outline">{course.tier === "premium" ? "Premium" : "Gratuito"}</Badge>
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-semibold leading-snug text-foreground">{course.title}</h3>
                      {course.subtitle ? <p className="mt-1 text-sm text-muted-foreground">{course.subtitle}</p> : null}
                    </div>
                    <p className="line-clamp-3 text-sm text-muted-foreground">{course.description}</p>
                    <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                      <span>{course.modules} módulo(s) · {course.lessons} aula(s)</span>
                      <span className="inline-flex items-center font-medium text-primary">Abrir <ArrowRight className="ml-1 size-3" /></span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
