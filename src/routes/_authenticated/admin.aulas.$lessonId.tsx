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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  adminDeleteLessonContent,
  adminDeleteLessonMedia,
  adminDeleteLessonQuestion,
  adminGetLesson,
  adminListLessonContent,
  adminListLessonMedia,
  adminListLessonQuestions,
  adminSaveLesson,
  adminSaveLessonContent,
  adminSaveLessonMedia,
  adminSaveLessonQuestion,
  adminSaveLessonScript,
} from "@/lib/admin.functions";
import { HIGHLIGHT_KIND, LESSON_SECTIONS } from "@/lib/school/lesson-view";
import { statusLabel, type ContentStatus } from "@/lib/school/admin-types";
import { extractReferences } from "@/lib/scripture-refs";
import type { AccessTier } from "@/lib/school/types";

export const Route = createFileRoute("/_authenticated/admin/aulas/$lessonId")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Editar aula — Painel Administrativo | Caminhando com Cristo" },
      {
        name: "description",
        content: "Editar conteúdo, referências bíblicas, questões e mídia da aula.",
      },
      { property: "og:title", content: "Editar aula" },
      { property: "og:description", content: "Gestão de conteúdo da Escola Bíblica." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLessonEditor,
});

const STATUSES: ContentStatus[] = ["draft", "published", "archived"];
const KIND_OPTIONS = [...LESSON_SECTIONS.map((s) => ({ kind: s.kind as string, label: s.label })), {
  kind: HIGHLIGHT_KIND,
  label: "Destaque",
}];
const QUESTION_KINDS = [
  { kind: "multipla_escolha", label: "Múltipla escolha" },
  { kind: "verdadeiro_falso", label: "Verdadeiro ou falso" },
  { kind: "resposta_curta", label: "Resposta curta" },
] as const;

function refsToText(refs: string[]): string {
  return refs.join("; ");
}

function textToRefs(value: string): string[] {
  return value
    .split(/[;\n]+/)
    .map((r) => r.trim())
    .filter(Boolean);
}

function AdminLessonEditor() {
  const { lessonId } = Route.useParams();
  const queryClient = useQueryClient();

  const fetchLesson = useServerFn(adminGetLesson);
  const saveLesson = useServerFn(adminSaveLesson);
  const saveScript = useServerFn(adminSaveLessonScript);
  const fetchContent = useServerFn(adminListLessonContent);
  const saveContent = useServerFn(adminSaveLessonContent);
  const removeContent = useServerFn(adminDeleteLessonContent);
  const fetchQuestions = useServerFn(adminListLessonQuestions);
  const saveQuestion = useServerFn(adminSaveLessonQuestion);
  const removeQuestion = useServerFn(adminDeleteLessonQuestion);
  const fetchMedia = useServerFn(adminListLessonMedia);
  const saveMedia = useServerFn(adminSaveLessonMedia);
  const removeMedia = useServerFn(adminDeleteLessonMedia);

  const lessonQuery = useQuery({
    queryKey: ["admin-lesson", lessonId],
    queryFn: () => fetchLesson({ data: { id: lessonId } }),
  });
  const contentQuery = useQuery({
    queryKey: ["admin-lesson-content", lessonId],
    queryFn: () => fetchContent({ data: { lesson_id: lessonId } }),
  });
  const questionsQuery = useQuery({
    queryKey: ["admin-lesson-questions", lessonId],
    queryFn: () => fetchQuestions({ data: { lesson_id: lessonId } }),
  });
  const mediaQuery = useQuery({
    queryKey: ["admin-lesson-media", lessonId],
    queryFn: () => fetchMedia({ data: { lesson_id: lessonId } }),
  });

  const lesson = lessonQuery.data?.lesson;
  const mod = lessonQuery.data?.module;
  const course = lessonQuery.data?.course;

  const [form, setForm] = useState({
    slug: "",
    title: "",
    summary: "",
    duration_minutes: 10,
    tier: "free" as AccessTier,
    status: "draft" as ContentStatus,
    order_index: 1,
    passage: "",
    keywords: "",
  });
  const [script, setScript] = useState("");

  useEffect(() => {
    if (!lesson) return;
    setForm({
      slug: lesson.slug,
      title: lesson.title,
      summary: lesson.summary,
      duration_minutes: lesson.duration_minutes,
      tier: lesson.tier as AccessTier,
      status: lesson.status as ContentStatus,
      order_index: lesson.order_index,
      passage: lesson.passage ?? "",
      keywords: (lesson.keywords ?? []).join(", "),
    });
    setScript(lesson.tts_script ?? "");
  }, [lesson]);

  const invalidateLesson = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-lesson", lessonId] });
    if (mod) queryClient.invalidateQueries({ queryKey: ["admin-course", mod.course_id] });
    queryClient.invalidateQueries({ queryKey: ["school-catalog"] });
  };

  const lessonMutation = useMutation({
    mutationFn: () =>
      saveLesson({
        data: {
          id: lessonId,
          module_id: mod?.id ?? "",
          slug: form.slug,
          title: form.title,
          summary: form.summary,
          duration_minutes: form.duration_minutes,
          tier: form.tier,
          status: form.status,
          order_index: form.order_index,
          passage: form.passage.trim() || null,
          keywords: form.keywords.split(",").map((item) => item.trim()).filter(Boolean),
        },
      }),
    onSuccess: () => {
      toast.success("Aula salva.");
      invalidateLesson();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const scriptMutation = useMutation({
    mutationFn: () => saveScript({ data: { id: lessonId, tts_script: script } }),
    onSuccess: () => {
      toast.success("Roteiro de narração salvo.");
      invalidateLesson();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // ----- Conteúdo -----
  const [blockDrafts, setBlockDrafts] = useState<
    Record<string, { kind: string; title: string; body: string; refs: string; order_index: number }>
  >({});

  useEffect(() => {
    const rows = contentQuery.data;
    if (!rows) return;
    setBlockDrafts(
      Object.fromEntries(
        rows.map((row) => [
          row.id,
          {
            kind: row.kind,
            title: row.title ?? "",
            body: row.body,
            refs: refsToText((row.scripture_refs ?? []) as string[]),
            order_index: row.order_index,
          },
        ]),
      ),
    );
  }, [contentQuery.data]);

  const contentMutation = useMutation({
    mutationFn: (input: {
      id?: string;
      kind: string;
      title: string;
      body: string;
      refs: string;
      order_index: number;
    }) =>
      saveContent({
        data: {
          ...(input.id ? { id: input.id } : {}),
          lesson_id: lessonId,
          kind: input.kind,
          title: input.title.trim() || null,
          body: input.body,
          scripture_refs: textToRefs(input.refs),
          order_index: input.order_index,
        },
      }),
    onSuccess: () => {
      toast.success("Conteúdo salvo.");
      queryClient.invalidateQueries({ queryKey: ["admin-lesson-content", lessonId] });
      queryClient.invalidateQueries({ queryKey: ["lesson-view"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const contentDelete = useMutation({
    mutationFn: (id: string) => removeContent({ data: { id } }),
    onSuccess: () => {
      toast.success("Bloco removido.");
      queryClient.invalidateQueries({ queryKey: ["admin-lesson-content", lessonId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const [newBlock, setNewBlock] = useState({
    kind: "texto",
    title: "",
    body: "",
    refs: "",
  });

  // ----- Questões -----
  const [newQuestion, setNewQuestion] = useState({
    kind: "multipla_escolha" as (typeof QUESTION_KINDS)[number]["kind"],
    prompt: "",
    options: "",
    answer_key: "",
    explanation: "",
  });

  const questionMutation = useMutation({
    mutationFn: (input: {
      id?: string;
      kind: (typeof QUESTION_KINDS)[number]["kind"];
      prompt: string;
      options: string[];
      answer_key: string | null;
      explanation: string | null;
      order_index: number;
    }) =>
      saveQuestion({
        data: {
          ...(input.id ? { id: input.id } : {}),
          lesson_id: lessonId,
          kind: input.kind,
          prompt: input.prompt,
          options: input.options,
          answer_key: input.answer_key,
          explanation: input.explanation,
          order_index: input.order_index,
        },
      }),
    onSuccess: () => {
      toast.success("Questão salva.");
      queryClient.invalidateQueries({ queryKey: ["admin-lesson-questions", lessonId] });
      setNewQuestion({
        kind: "multipla_escolha",
        prompt: "",
        options: "",
        answer_key: "",
        explanation: "",
      });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const questionDelete = useMutation({
    mutationFn: (id: string) => removeQuestion({ data: { id } }),
    onSuccess: () => {
      toast.success("Questão removida.");
      queryClient.invalidateQueries({ queryKey: ["admin-lesson-questions", lessonId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // ----- Mídia -----
  const [newMedia, setNewMedia] = useState({
    kind: "video" as "video" | "audio",
    provider: "youtube",
    url: "",
    title: "",
  });

  const mediaMutation = useMutation({
    mutationFn: (input: {
      id?: string;
      kind: "video" | "audio";
      provider: string;
      url: string;
      title: string | null;
      status: ContentStatus;
      order_index: number;
    }) =>
      saveMedia({
        data: {
          ...(input.id ? { id: input.id } : {}),
          lesson_id: lessonId,
          kind: input.kind,
          provider: input.provider,
          url: input.url,
          title: input.title,
          status: input.status,
          order_index: input.order_index,
        },
      }),
    onSuccess: () => {
      toast.success("Mídia salva.");
      queryClient.invalidateQueries({ queryKey: ["admin-lesson-media", lessonId] });
      setNewMedia({ kind: "video", provider: "youtube", url: "", title: "" });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const mediaDelete = useMutation({
    mutationFn: (id: string) => removeMedia({ data: { id } }),
    onSuccess: () => {
      toast.success("Mídia removida.");
      queryClient.invalidateQueries({ queryKey: ["admin-lesson-media", lessonId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (lessonQuery.isLoading) {
    return (
      <AppShell title="Editar aula" subtitle="Painel Administrativo">
        <p className="text-sm text-muted-foreground">Carregando aula…</p>
      </AppShell>
    );
  }

  if (!lesson || !mod) {
    return (
      <AppShell title="Aula não encontrada" subtitle="Painel Administrativo">
        <Card className="p-5 text-sm text-muted-foreground">
          Esta aula não existe mais.{" "}
          <Link to="/admin/cursos" className="underline">
            Voltar aos cursos
          </Link>
        </Card>
      </AppShell>
    );
  }

  const blocks = contentQuery.data ?? [];
  const questions = questionsQuery.data ?? [];
  const medias = mediaQuery.data ?? [];

  return (
    <AppShell title={lesson.title} subtitle={`${course?.title ?? "Curso"} · ${mod.title}`}>
      <div className="space-y-5">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/admin/cursos/$id" params={{ id: mod.course_id }}>
            <ArrowLeft className="mr-1 size-4" /> Voltar ao curso
          </Link>
        </Button>

        <Tabs defaultValue="dados">
          <TabsList className="flex-wrap">
            <TabsTrigger value="dados">Dados</TabsTrigger>
            <TabsTrigger value="conteudo">Conteúdo</TabsTrigger>
            <TabsTrigger value="questoes">Questões</TabsTrigger>
            <TabsTrigger value="midia">Mídia</TabsTrigger>
            <TabsTrigger value="roteiro">Roteiro</TabsTrigger>
          </TabsList>

          {/* ---------- Dados ---------- */}
          <TabsContent value="dados" className="mt-4">
            <Card className="space-y-3 p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="lesson-title">Título</Label>
                  <Input
                    id="lesson-title"
                    value={form.title}
                    onChange={(event) => setForm((f) => ({ ...f, title: event.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lesson-slug">Slug</Label>
                  <Input
                    id="lesson-slug"
                    value={form.slug}
                    onChange={(event) => setForm((f) => ({ ...f, slug: event.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lesson-summary">Descrição / objetivo da aula</Label>
                <Textarea
                  id="lesson-summary"
                  rows={4}
                  value={form.summary}
                  onChange={(event) => setForm((f) => ({ ...f, summary: event.target.value }))}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="lesson-passage">Passagem-base</Label>
                  <Input id="lesson-passage" value={form.passage} onChange={(event) => setForm((f) => ({ ...f, passage: event.target.value }))} placeholder="Ex.: Gênesis 1:1–2:3" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lesson-keywords">Palavras-chave</Label>
                  <Input id="lesson-keywords" value={form.keywords} onChange={(event) => setForm((f) => ({ ...f, keywords: event.target.value }))} placeholder="criação, aliança, pregação" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="lesson-duration">Duração (min)</Label>
                  <Input
                    id="lesson-duration"
                    type="number"
                    min={1}
                    value={form.duration_minutes}
                    onChange={(event) =>
                      setForm((f) => ({
                        ...f,
                        duration_minutes: Number(event.target.value) || 1,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lesson-order">Ordem</Label>
                  <Input
                    id="lesson-order"
                    type="number"
                    min={0}
                    value={form.order_index}
                    onChange={(event) =>
                      setForm((f) => ({ ...f, order_index: Number(event.target.value) || 0 }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Acesso</Label>
                  <div className="flex gap-2">
                    {(["free", "premium"] as AccessTier[]).map((option) => (
                      <Button
                        key={option}
                        type="button"
                        size="sm"
                        variant={form.tier === option ? "secondary" : "ghost"}
                        onClick={() => setForm((f) => ({ ...f, tier: option }))}
                      >
                        {option === "free" ? "Gratuito" : "Premium"}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {STATUSES.map((option) => (
                  <Button
                    key={option}
                    type="button"
                    size="sm"
                    variant={form.status === option ? "default" : "outline"}
                    onClick={() => setForm((f) => ({ ...f, status: option }))}
                  >
                    {statusLabel(option)}
                  </Button>
                ))}
                <Button
                  className="ml-auto"
                  onClick={() => lessonMutation.mutate()}
                  disabled={lessonMutation.isPending || form.title.trim().length < 2}
                >
                  {lessonMutation.isPending ? "Salvando…" : "Salvar aula"}
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* ---------- Conteúdo ---------- */}
          <TabsContent value="conteudo" className="mt-4 space-y-4">
            {blocks.map((row) => {
              const draft = blockDrafts[row.id];
              if (!draft) return null;
              const detected = extractReferences(`${draft.body} ${draft.refs}`);
              return (
                <Card key={row.id} className="space-y-3 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">
                      {KIND_OPTIONS.find((k) => k.kind === draft.kind)?.label ?? draft.kind}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      ordem {draft.order_index}
                    </span>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="ml-auto"
                      aria-label="Remover bloco"
                      onClick={() => {
                        if (
                          window.confirm(
                            "Remover este bloco de conteúdo? Esta ação não pode ser desfeita.",
                          )
                        ) {
                          contentDelete.mutate(row.id);
                        }
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label>Seção</Label>
                      <Select
                        value={draft.kind}
                        onValueChange={(value) =>
                          setBlockDrafts((prev) => ({
                            ...prev,
                            [row.id]: { ...draft, kind: value },
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {KIND_OPTIONS.map((option) => (
                            <SelectItem key={option.kind} value={option.kind}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>Título do bloco</Label>
                      <Input
                        value={draft.title}
                        onChange={(event) =>
                          setBlockDrafts((prev) => ({
                            ...prev,
                            [row.id]: { ...draft, title: event.target.value },
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Texto</Label>
                    <Textarea
                      rows={8}
                      value={draft.body}
                      onChange={(event) =>
                        setBlockDrafts((prev) => ({
                          ...prev,
                          [row.id]: { ...draft, body: event.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Referências bíblicas (separe com ponto e vírgula)</Label>
                    <Input
                      value={draft.refs}
                      onChange={(event) =>
                        setBlockDrafts((prev) => ({
                          ...prev,
                          [row.id]: { ...draft, refs: event.target.value },
                        }))
                      }
                      placeholder="João 3:16; 2 Timóteo 3:16-17"
                    />
                    {detected.length ? (
                      <p className="text-xs text-muted-foreground">
                        Reconhecidas: {detected.join(" · ")}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Label className="text-xs">Ordem</Label>
                    <Input
                      type="number"
                      min={0}
                      className="w-24"
                      value={draft.order_index}
                      onChange={(event) =>
                        setBlockDrafts((prev) => ({
                          ...prev,
                          [row.id]: { ...draft, order_index: Number(event.target.value) || 0 },
                        }))
                      }
                    />
                    <Button
                      size="sm"
                      className="ml-auto"
                      onClick={() => contentMutation.mutate({ id: row.id, ...draft })}
                      disabled={contentMutation.isPending || draft.body.trim().length < 1}
                    >
                      Salvar bloco
                    </Button>
                  </div>
                </Card>
              );
            })}

            <Card className="space-y-3 p-5">
              <p className="font-display text-base font-semibold">Novo bloco de conteúdo</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Seção</Label>
                  <Select
                    value={newBlock.kind}
                    onValueChange={(value) => setNewBlock((b) => ({ ...b, kind: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {KIND_OPTIONS.map((option) => (
                        <SelectItem key={option.kind} value={option.kind}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Título do bloco</Label>
                  <Input
                    value={newBlock.title}
                    onChange={(event) => setNewBlock((b) => ({ ...b, title: event.target.value }))}
                  />
                </div>
              </div>
              <Textarea
                rows={6}
                placeholder="Texto do bloco…"
                value={newBlock.body}
                onChange={(event) => setNewBlock((b) => ({ ...b, body: event.target.value }))}
              />
              <Input
                placeholder="Referências: João 3:16; Salmos 23"
                value={newBlock.refs}
                onChange={(event) => setNewBlock((b) => ({ ...b, refs: event.target.value }))}
              />
              <Button
                size="sm"
                disabled={contentMutation.isPending || newBlock.body.trim().length < 1}
                onClick={() =>
                  contentMutation.mutate(
                    {
                      kind: newBlock.kind,
                      title: newBlock.title,
                      body: newBlock.body,
                      refs: newBlock.refs,
                      order_index: blocks.length + 1,
                    },
                    {
                      onSuccess: () => setNewBlock({ kind: "texto", title: "", body: "", refs: "" }),
                    },
                  )
                }
              >
                <Plus className="mr-1 size-4" /> Adicionar bloco
              </Button>
            </Card>
          </TabsContent>

          {/* ---------- Questões ---------- */}
          <TabsContent value="questoes" className="mt-4 space-y-4">
            {questions.map((question) => (
              <Card key={question.id} className="space-y-2 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">
                    {QUESTION_KINDS.find((k) => k.kind === question.kind)?.label ?? question.kind}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    ordem {question.order_index}
                  </span>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="ml-auto"
                    aria-label="Remover questão"
                    onClick={() => {
                      if (window.confirm("Remover esta questão?")) {
                        questionDelete.mutate(question.id);
                      }
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <p className="text-sm font-medium">{question.prompt}</p>
                {Array.isArray(question.options) && question.options.length ? (
                  <ul className="list-disc pl-5 text-sm text-muted-foreground">
                    {(question.options as string[]).map((option, index) => (
                      <li key={index}>{option}</li>
                    ))}
                  </ul>
                ) : null}
                {question.answer_key ? (
                  <p className="text-xs text-muted-foreground">
                    Resposta esperada: {question.answer_key}
                  </p>
                ) : null}
              </Card>
            ))}

            <Card className="space-y-3 p-5">
              <p className="font-display text-base font-semibold">Nova questão</p>
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select
                  value={newQuestion.kind}
                  onValueChange={(value) =>
                    setNewQuestion((q) => ({
                      ...q,
                      kind: value as (typeof QUESTION_KINDS)[number]["kind"],
                    }))
                  }
                >
                  <SelectTrigger className="max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QUESTION_KINDS.map((option) => (
                      <SelectItem key={option.kind} value={option.kind}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                rows={3}
                placeholder="Pergunta…"
                value={newQuestion.prompt}
                onChange={(event) => setNewQuestion((q) => ({ ...q, prompt: event.target.value }))}
              />
              {newQuestion.kind === "multipla_escolha" ? (
                <Textarea
                  rows={4}
                  placeholder="Alternativas, uma por linha"
                  value={newQuestion.options}
                  onChange={(event) =>
                    setNewQuestion((q) => ({ ...q, options: event.target.value }))
                  }
                />
              ) : null}
              <Input
                placeholder="Resposta correta (opcional)"
                value={newQuestion.answer_key}
                onChange={(event) =>
                  setNewQuestion((q) => ({ ...q, answer_key: event.target.value }))
                }
              />
              <Textarea
                rows={3}
                placeholder="Explicação (opcional)"
                value={newQuestion.explanation}
                onChange={(event) =>
                  setNewQuestion((q) => ({ ...q, explanation: event.target.value }))
                }
              />
              <Button
                size="sm"
                disabled={questionMutation.isPending || newQuestion.prompt.trim().length < 3}
                onClick={() =>
                  questionMutation.mutate({
                    kind: newQuestion.kind,
                    prompt: newQuestion.prompt.trim(),
                    options:
                      newQuestion.kind === "multipla_escolha"
                        ? newQuestion.options
                            .split("\n")
                            .map((o) => o.trim())
                            .filter(Boolean)
                        : newQuestion.kind === "verdadeiro_falso"
                          ? ["Verdadeiro", "Falso"]
                          : [],
                    answer_key: newQuestion.answer_key.trim() || null,
                    explanation: newQuestion.explanation.trim() || null,
                    order_index: questions.length + 1,
                  })
                }
              >
                <Plus className="mr-1 size-4" /> Adicionar questão
              </Button>
            </Card>
          </TabsContent>

          {/* ---------- Mídia ---------- */}
          <TabsContent value="midia" className="mt-4 space-y-4">
            {medias.map((media) => (
              <Card key={media.id} className="space-y-2 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{media.kind === "audio" ? "Áudio" : "Vídeo"}</Badge>
                  <Badge variant={media.status === "published" ? "default" : "outline"}>
                    {statusLabel(media.status as ContentStatus)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{media.provider}</span>
                  <div className="ml-auto flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        mediaMutation.mutate({
                          id: media.id,
                          kind: media.kind as "video" | "audio",
                          provider: media.provider,
                          url: media.url,
                          title: media.title,
                          status: media.status === "published" ? "draft" : "published",
                          order_index: media.order_index,
                        })
                      }
                    >
                      {media.status === "published" ? "Despublicar" : "Publicar"}
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Remover mídia"
                      onClick={() => {
                        if (window.confirm("Remover esta mídia da aula?")) {
                          mediaDelete.mutate(media.id);
                        }
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm font-medium">{media.title ?? "Sem título"}</p>
                <p className="break-all text-xs text-muted-foreground">{media.url}</p>
              </Card>
            ))}

            <Card className="space-y-3 p-5">
              <p className="font-display text-base font-semibold">Nova mídia por URL</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Tipo</Label>
                  <Select
                    value={newMedia.kind}
                    onValueChange={(value) =>
                      setNewMedia((m) => ({ ...m, kind: value as "video" | "audio" }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Vídeo</SelectItem>
                      <SelectItem value="audio">Áudio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Provedor</Label>
                  <Input
                    value={newMedia.provider}
                    onChange={(event) =>
                      setNewMedia((m) => ({ ...m, provider: event.target.value }))
                    }
                    placeholder="youtube, vimeo, url"
                  />
                </div>
              </div>
              <Input
                placeholder="Título da mídia"
                value={newMedia.title}
                onChange={(event) => setNewMedia((m) => ({ ...m, title: event.target.value }))}
              />
              <Input
                placeholder="https://…"
                value={newMedia.url}
                onChange={(event) => setNewMedia((m) => ({ ...m, url: event.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Nesta etapa a mídia é cadastrada por link. Upload de arquivos exige armazenamento e
                será implementado depois.
              </p>
              <Button
                size="sm"
                disabled={mediaMutation.isPending || !newMedia.url.startsWith("http")}
                onClick={() =>
                  mediaMutation.mutate({
                    kind: newMedia.kind,
                    provider: newMedia.provider.trim() || "url",
                    url: newMedia.url.trim(),
                    title: newMedia.title.trim() || null,
                    status: "draft",
                    order_index: medias.length + 1,
                  })
                }
              >
                <Plus className="mr-1 size-4" /> Adicionar mídia
              </Button>
            </Card>
          </TabsContent>

          {/* ---------- Roteiro ---------- */}
          <TabsContent value="roteiro" className="mt-4">
            <Card className="space-y-3 p-5">
              <p className="font-display text-base font-semibold">Roteiro de narração</p>
              <p className="text-sm text-muted-foreground">
                Texto separado do conteúdo de leitura, preparado para narração futura.
              </p>
              <Textarea rows={14} value={script} onChange={(event) => setScript(event.target.value)} />
              <Button
                size="sm"
                onClick={() => scriptMutation.mutate()}
                disabled={scriptMutation.isPending}
              >
                {scriptMutation.isPending ? "Salvando…" : "Salvar roteiro"}
              </Button>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
