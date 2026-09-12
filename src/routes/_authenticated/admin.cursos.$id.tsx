import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  adminDeleteLesson,
  adminDeleteModule,
  adminGetCourse,
  adminSaveCourse,
  adminSaveLesson,
  adminSaveModule,
} from "@/lib/admin.functions";
import { COURSE_LEVELS } from "@/lib/school/types";
import { slugify, statusLabel, type ContentStatus } from "@/lib/school/admin-types";
import type { AccessTier, CourseLevel } from "@/lib/school/types";

export const Route = createFileRoute("/_authenticated/admin/cursos/$id")({
  head: () => ({
    meta: [
      { title: "Editar curso — Painel Administrativo | Caminhando com Cristo" },
      { name: "description", content: "Editar curso, módulos e aulas da Escola Bíblica." },
      { property: "og:title", content: "Editar curso" },
      { property: "og:description", content: "Gestão de módulos e aulas." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminCourseEditor,
});

const STATUSES: ContentStatus[] = ["draft", "published", "archived"];

function AdminCourseEditor() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const fetchCourse = useServerFn(adminGetCourse);
  const saveCourse = useServerFn(adminSaveCourse);
  const saveModule = useServerFn(adminSaveModule);
  const removeModule = useServerFn(adminDeleteModule);
  const saveLesson = useServerFn(adminSaveLesson);
  const removeLesson = useServerFn(adminDeleteLesson);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-course", id],
    queryFn: () => fetchCourse({ data: { id } }),
  });

  const [form, setForm] = useState({
    slug: "",
    title: "",
    subtitle: "",
    description: "",
    level: "iniciante" as CourseLevel,
    tier: "free" as AccessTier,
    status: "draft" as ContentStatus,
    order_index: 1,
  });

  useEffect(() => {
    const course = data?.course;
    if (!course) return;
    setForm({
      slug: course.slug,
      title: course.title,
      subtitle: course.subtitle ?? "",
      description: course.description,
      level: course.level,
      tier: course.tier,
      status: course.status,
      order_index: course.order_index,
    });
  }, [data?.course]);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin-course", id] });
    queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
    queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    queryClient.invalidateQueries({ queryKey: ["school-catalog"] });
  }

  const updateCourse = useMutation({
    mutationFn: () =>
      saveCourse({
        data: {
          id,
          slug: form.slug,
          title: form.title,
          subtitle: form.subtitle.trim() || null,
          description: form.description,
          level: form.level,
          tier: form.tier,
          status: form.status,
          order_index: form.order_index,
        },
      }),
    onSuccess: () => {
      toast.success("Curso salvo.");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const [newModuleTitle, setNewModuleTitle] = useState("");
  const addModule = useMutation({
    mutationFn: () =>
      saveModule({
        data: {
          course_id: id,
          title: newModuleTitle.trim(),
          summary: "",
          order_index: (data?.modules.length ?? 0) + 1,
          status: "draft" as ContentStatus,
          testament: null,
          category: null,
          book_number: null,
        },
      }),
    onSuccess: () => {
      setNewModuleTitle("");
      toast.success("Módulo criado.");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const moduleMutation = useMutation({
    mutationFn: (input: {
      id: string;
      title: string;
      summary: string;
      order_index: number;
      status: ContentStatus;
      testament: string | null;
      category: string | null;
      book_number: number | null;
    }) => saveModule({ data: { ...input, course_id: id } }),
    onSuccess: () => {
      toast.success("Módulo atualizado.");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteModule = useMutation({
    mutationFn: (moduleId: string) => removeModule({ data: { id: moduleId } }),
    onSuccess: () => {
      toast.success("Módulo removido.");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const [lessonTitles, setLessonTitles] = useState<Record<string, string>>({});
  const addLesson = useMutation({
    mutationFn: (input: { moduleId: string; title: string; count: number }) =>
      saveLesson({
        data: {
          module_id: input.moduleId,
          slug: slugify(input.title),
          title: input.title.trim(),
          summary: "",
          duration_minutes: 10,
          tier: form.tier,
          status: "draft" as ContentStatus,
          order_index: input.count + 1,
        },
      }),
    onSuccess: (_result, variables) => {
      setLessonTitles((prev) => ({ ...prev, [variables.moduleId]: "" }));
      toast.success("Aula criada.");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const lessonStatus = useMutation({
    mutationFn: (input: {
      lesson: {
        id: string;
        module_id: string;
        slug: string;
        title: string;
        summary: string;
        duration_minutes: number;
        tier: AccessTier;
        order_index: number;
        passage: string | null;
        keywords: string[];
      };
      status: ContentStatus;
    }) => saveLesson({ data: { ...input.lesson, status: input.status } }),
    onSuccess: () => {
      toast.success("Aula atualizada.");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteLesson = useMutation({
    mutationFn: (lessonId: string) => removeLesson({ data: { id: lessonId } }),
    onSuccess: () => {
      toast.success("Aula removida.");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isLoading) {
    return (
      <AppShell title="Editar curso" subtitle="Painel Administrativo">
        <p className="text-sm text-muted-foreground">Carregando…</p>
      </AppShell>
    );
  }

  if (!data?.course) {
    return (
      <AppShell title="Curso não encontrado" subtitle="Painel Administrativo">
        <Card className="p-5 text-sm text-muted-foreground">Este curso não existe mais.</Card>
      </AppShell>
    );
  }

  return (
    <AppShell title={data.course.title} subtitle="Editar curso, módulos e aulas">
      <div className="space-y-5">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/admin/cursos">
            <ArrowLeft className="mr-1 size-4" /> Cursos
          </Link>
        </Button>

        <Card className="space-y-3 p-5">
          <h2 className="font-display text-lg font-semibold">Dados do curso</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(event) => setForm((f) => ({ ...f, title: event.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={form.slug}
                onChange={(event) => setForm((f) => ({ ...f, slug: slugify(event.target.value) }))}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="subtitle">Descrição curta</Label>
            <Input
              id="subtitle"
              value={form.subtitle}
              onChange={(event) => setForm((f) => ({ ...f, subtitle: event.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Descrição completa</Label>
            <Textarea
              id="description"
              rows={4}
              value={form.description}
              onChange={(event) => setForm((f) => ({ ...f, description: event.target.value }))}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {COURSE_LEVELS.map((option) => (
              <Button
                key={option.key}
                size="sm"
                variant={form.level === option.key ? "default" : "outline"}
                onClick={() => setForm((f) => ({ ...f, level: option.key }))}
              >
                {option.label}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {(["free", "premium"] as AccessTier[]).map((option) => (
              <Button
                key={option}
                size="sm"
                variant={form.tier === option ? "secondary" : "ghost"}
                onClick={() => setForm((f) => ({ ...f, tier: option }))}
              >
                {option === "free" ? "Gratuito" : "Premium"}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {STATUSES.map((option) => (
              <Button
                key={option}
                size="sm"
                variant={form.status === option ? "default" : "outline"}
                onClick={() => setForm((f) => ({ ...f, status: option }))}
              >
                {statusLabel(option)}
              </Button>
            ))}
            <div className="ml-auto flex items-center gap-2">
              <Label htmlFor="order">Ordem</Label>
              <Input
                id="order"
                type="number"
                min={0}
                className="w-20"
                value={form.order_index}
                onChange={(event) =>
                  setForm((f) => ({ ...f, order_index: Number(event.target.value) || 0 }))
                }
              />
            </div>
          </div>
          <Button onClick={() => updateCourse.mutate()} disabled={updateCourse.isPending}>
            {updateCourse.isPending ? "Salvando…" : "Salvar curso"}
          </Button>
        </Card>

        <Card className="space-y-3 p-5">
          <h2 className="font-display text-lg font-semibold">Módulos</h2>
          <div className="flex flex-wrap gap-2">
            <Input
              value={newModuleTitle}
              onChange={(event) => setNewModuleTitle(event.target.value)}
              placeholder="Título do novo módulo"
              className="max-w-xs"
            />
            <Button
              size="sm"
              onClick={() => addModule.mutate()}
              disabled={addModule.isPending || newModuleTitle.trim().length < 2}
            >
              <Plus className="mr-1 size-4" /> Adicionar módulo
            </Button>
          </div>

          <div className="space-y-4">
            {data.modules.map((mod) => {
              const lessons = data.lessons.filter((l) => l.module_id === mod.id);
              return (
                <div key={mod.id} className="rounded-xl border border-border/70 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={mod.status === "published" ? "default" : "outline"}>
                      {statusLabel(mod.status)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">ordem {mod.order_index}</span>
                    <div className="ml-auto flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          moduleMutation.mutate({
                            id: mod.id,
                            title: mod.title,
                            summary: mod.summary,
                            order_index: mod.order_index,
                            status: mod.status === "published" ? "draft" : "published",
                            testament: mod.testament,
                            category: mod.category,
                            book_number: mod.book_number,
                          })
                        }
                      >
                        {mod.status === "published" ? "Despublicar" : "Publicar"}
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label="Remover módulo"
                        onClick={() => deleteModule.mutate(mod.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="mt-2 font-medium">{mod.title}</p>
                  <p className="text-sm text-muted-foreground">{mod.summary}</p>

                  <ul className="mt-3 divide-y divide-border/70">
                    {lessons.map((lesson) => (
                      <li key={lesson.id} className="flex flex-wrap items-center gap-2 py-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{lesson.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {lesson.duration_minutes} min · {statusLabel(lesson.status)} ·{" "}
                            {lesson.tier === "premium" ? "Premium" : "Gratuito"}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            lessonStatus.mutate({
                              lesson: {
                                id: lesson.id,
                                module_id: lesson.module_id,
                                slug: lesson.slug,
                                title: lesson.title,
                                summary: lesson.summary,
                                duration_minutes: lesson.duration_minutes,
                                tier: lesson.tier,
                                order_index: lesson.order_index,
                                passage: lesson.passage,
                                keywords: lesson.keywords,
                              },
                              status: lesson.status === "published" ? "draft" : "published",
                            })
                          }
                        >
                          {lesson.status === "published" ? "Despublicar" : "Publicar"}
                        </Button>
                        <Button asChild size="sm" variant="secondary">
                          <Link to="/admin/aulas/$lessonId" params={{ lessonId: lesson.id }}>
                            Editar conteúdo
                          </Link>
                        </Button>
                        <Button

                          size="icon-sm"
                          variant="ghost"
                          aria-label="Remover aula"
                          onClick={() => deleteLesson.mutate(lesson.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Input
                      value={lessonTitles[mod.id] ?? ""}
                      onChange={(event) =>
                        setLessonTitles((prev) => ({ ...prev, [mod.id]: event.target.value }))
                      }
                      placeholder="Título da nova aula"
                      className="max-w-xs"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={(lessonTitles[mod.id] ?? "").trim().length < 2}
                      onClick={() =>
                        addLesson.mutate({
                          moduleId: mod.id,
                          title: lessonTitles[mod.id] ?? "",
                          count: lessons.length,
                        })
                      }
                    >
                      <Plus className="mr-1 size-4" /> Adicionar aula
                    </Button>
                  </div>
                </div>
              );
            })}
            {data.modules.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum módulo ainda. Comece adicionando o primeiro acima.
              </p>
            ) : null}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
