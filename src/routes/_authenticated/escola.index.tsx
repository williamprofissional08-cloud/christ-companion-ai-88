import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, GraduationCap, ArrowRight, ShieldCheck } from "lucide-react";
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
  const admin = useQuery({
    queryKey: ["am-i-admin"],
    queryFn: () => checkAdmin(),
    staleTime: 60_000,
  });

  return (
    <AppShell title="Escola Bíblica" subtitle="Aprenda as Escrituras com profundidade, contexto e fidelidade ao texto bíblico.">
      <div className="space-y-5">
        <Card className="flex items-start gap-3 p-5">
          <div className="rounded-xl bg-primary/10 p-3 text-primary">
            <GraduationCap className="size-6" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-semibold">Formação bíblica</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Cursos, módulos e aulas organizados para ajudar você a compreender o contexto,
              interpretar com responsabilidade e aplicar a Palavra de Deus.
            </p>
          </div>
        </Card>

        {catalog.isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando cursos publicados…</p>
        ) : catalog.isError ? (
          <Card className="space-y-3 p-5">
            <h2 className="font-semibold">Não foi possível carregar a Escola Bíblica</h2>
            <p className="text-sm text-muted-foreground">
              {catalog.error instanceof Error ? catalog.error.message : "Tente novamente em instantes."}
            </p>
            <Button variant="outline" size="sm" onClick={() => catalog.refetch()}>Tentar novamente</Button>
          </Card>
        ) : (catalog.data ?? []).length === 0 ? (
          <Card className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-6 py-10 text-center">
            <div className="rounded-full bg-primary/10 p-4">
              <BookOpen className="size-8 text-primary" aria-hidden />
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
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-base font-semibold">Cursos disponíveis</h2>
                <p className="text-xs text-muted-foreground">{catalog.data.length} curso(s) publicado(s)</p>
              </div>
              {admin.data ? (
                <Button asChild size="sm" variant="outline"><Link to="/admin/cursos">Administrar</Link></Button>
              ) : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {catalog.data.map((course) => (
                <Link key={course.id} to="/escola/$slug" params={{ slug: course.slug }} className="block">
                  <Card className="h-full space-y-3 p-5 transition-shadow hover:shadow-md">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{levelLabel(course.level)}</Badge>
                      <Badge variant="outline">{course.tier === "premium" ? "Premium" : "Gratuito"}</Badge>
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-semibold">{course.title}</h3>
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
