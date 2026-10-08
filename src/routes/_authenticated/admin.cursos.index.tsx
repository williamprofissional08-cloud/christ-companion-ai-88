import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { adminListCourses, adminSaveCourse, adminSetCourseStatus } from "@/lib/admin.functions";
import { COURSE_LEVELS, levelLabel } from "@/lib/school/types";
import { slugify, statusLabel, type ContentStatus } from "@/lib/school/admin-types";
import type { AccessTier, CourseLevel } from "@/lib/school/types";

export const Route = createFileRoute("/_authenticated/admin/cursos/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Cursos — Painel Administrativo | Caminhando com Cristo" },
      { name: "description", content: "Gerenciar cursos da Escola Bíblica." },
      { property: "og:title", content: "Cursos — Painel Administrativo" },
      { property: "og:description", content: "Criar, publicar e organizar cursos." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminCourses,
});

function AdminCourses() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const fetchCourses = useServerFn(adminListCourses);
  const saveCourse = useServerFn(adminSaveCourse);
  const setStatus = useServerFn(adminSetCourseStatus);

  const { data: courses, isLoading } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: () => fetchCourses(),
  });

  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState<CourseLevel>("iniciante");
  const [tier, setTier] = useState<AccessTier>("free");

  const create = useMutation({
    mutationFn: () =>
      saveCourse({
        data: {
          slug: slug.trim() || slugify(title),
          title: title.trim(),
          subtitle: subtitle.trim() || null,
          description: description.trim() || subtitle.trim() || title.trim(),
          level,
          tier,
          status: "draft" as ContentStatus,
          order_index: (courses?.length ?? 0) + 1,
        },
      }),
    onSuccess: (result) => {
      toast.success("Curso criado como rascunho.");
      setCreating(false);
      setTitle("");
      setSlug("");
      setSubtitle("");
      setDescription("");
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      navigate({ to: "/admin/cursos/$id", params: { id: result.id } });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const changeStatus = useMutation({
    mutationFn: (input: { id: string; status: ContentStatus }) => setStatus({ data: input }),
    onSuccess: () => {
      toast.success("Status atualizado.");
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      queryClient.invalidateQueries({ queryKey: ["school-catalog"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <AppShell title="Cursos" subtitle="Painel Administrativo — Escola Bíblica">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link to="/admin">
              <ArrowLeft className="mr-1 size-4" /> Painel
            </Link>
          </Button>
          <Button size="sm" onClick={() => setCreating((value) => !value)}>
            <Plus className="mr-1 size-4" /> Novo curso
          </Button>
        </div>

        {creating ? (
          <Card className="space-y-3 p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="course-title">Título</Label>
                <Input
                  id="course-title"
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value);
                    if (!slug) setSlug("");
                  }}
                  placeholder="Como Estudar a Bíblia"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="course-slug">Slug</Label>
                <Input
                  id="course-slug"
                  value={slug}
                  onChange={(event) => setSlug(slugify(event.target.value))}
                  placeholder={slugify(title) || "como-estudar-a-biblia"}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="course-subtitle">Descrição curta</Label>
              <Input
                id="course-subtitle"
                value={subtitle}
                onChange={(event) => setSubtitle(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="course-description">Descrição completa</Label>
              <Textarea
                id="course-description"
                rows={4}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {COURSE_LEVELS.map((option) => (
                <Button
                  key={option.key}
                  type="button"
                  size="sm"
                  variant={level === option.key ? "default" : "outline"}
                  onClick={() => setLevel(option.key)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {(["free", "premium"] as AccessTier[]).map((option) => (
                <Button
                  key={option}
                  type="button"
                  size="sm"
                  variant={tier === option ? "secondary" : "ghost"}
                  onClick={() => setTier(option)}
                >
                  {option === "free" ? "Gratuito" : "Premium"}
                </Button>
              ))}
            </div>
            <Button
              onClick={() => create.mutate()}
              disabled={create.isPending || title.trim().length < 3}
            >
              {create.isPending ? "Criando…" : "Criar curso (rascunho)"}
            </Button>
          </Card>
        ) : null}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando cursos…</p>
        ) : (courses ?? []).length ? (
          <div className="space-y-3">
            {(courses ?? []).map((course) => (
              <Card key={course.id} className="space-y-3 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{levelLabel(course.level)}</Badge>
                  <Badge variant={course.tier === "premium" ? "default" : "outline"}>
                    {course.tier === "premium" ? "Premium" : "Gratuito"}
                  </Badge>
                  <Badge variant={course.status === "published" ? "default" : "outline"}>
                    {statusLabel(course.status)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">ordem {course.order_index}</span>
                </div>
                <div>
                  <h2 className="font-display text-lg font-semibold">{course.title}</h2>
                  <p className="text-sm text-muted-foreground">{course.subtitle}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link to="/admin/cursos/$id" params={{ id: course.id }}>
                      Editar
                    </Link>
                  </Button>
                  {course.status !== "published" ? (
                    <Button
                      size="sm"
                      onClick={() => changeStatus.mutate({ id: course.id, status: "published" })}
                    >
                      Publicar
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => changeStatus.mutate({ id: course.id, status: "draft" })}
                    >
                      Despublicar
                    </Button>
                  )}
                  {course.status !== "archived" ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => changeStatus.mutate({ id: course.id, status: "archived" })}
                    >
                      Arquivar
                    </Button>
                  ) : null}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-5 text-sm text-muted-foreground">Nenhum curso cadastrado ainda.</Card>
        )}
      </div>
    </AppShell>
  );
}
