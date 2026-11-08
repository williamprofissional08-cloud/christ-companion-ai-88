import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BookOpen, Save } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { adminListManagedContent, adminSaveManagedContent } from "@/lib/admin.functions";

type Item = {
  kind: "study" | "prayer_plan";
  slug: string;
  title: string;
  category: string;
  reference: string;
  summary: string;
  depth?: "simple" | "deep";
  days?: number;
  keyVerse?: string;
  status: "draft" | "published" | "archived" | "legacy";
  content: unknown | null;
};

export const Route = createFileRoute("/_authenticated/admin/conteudo")({
  component: AdminContentPage,
});

function AdminContentPage() {
  const queryClient = useQueryClient();
  const listFn = useServerFn(adminListManagedContent);
  const saveFn = useServerFn(adminSaveManagedContent);
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-managed-content"],
    queryFn: () => listFn(),
  });
  const [selectedKey, setSelectedKey] = useState("");
  const selected = useMemo<Item | undefined>(() => {
    const found = data.find((item) => `${item.kind}:${item.slug}` === selectedKey);
    if (found) return found;
    if (selectedKey === "new:study") return {
      kind: "study", slug: "", title: "", category: "Antigo Testamento", reference: "",
      summary: "", depth: "simple", status: "draft", content: null,
    };
    if (selectedKey === "new:prayer_plan") return {
      kind: "prayer_plan", slug: "", title: "", category: "Intimidade", reference: "",
      summary: "", days: 21, keyVerse: "", status: "draft", content: null,
    };
    return data[0];
  }, [data, selectedKey]);
  const [kind, setKind] = useState<"study" | "prayer_plan">("study");
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [reference, setReference] = useState("");
  const [summary, setSummary] = useState("");
  const [depth, setDepth] = useState<"simple" | "deep">("simple");
  const [days, setDays] = useState("21");
  const [keyVerse, setKeyVerse] = useState("");
  const [status, setStatus] = useState<"draft" | "published" | "archived">("draft");
  const [contentJson, setContentJson] = useState("");
  const [jsonError, setJsonError] = useState("");

  useEffect(() => {
    if (!selected) return;
    setKind(selected.kind);
    setSlug(selected.slug);
    setTitle(selected.title);
    setCategory(selected.category);
    setReference(selected.reference);
    setSummary(selected.summary);
    setDepth(selected.depth ?? "simple");
    setDays(String(selected.days ?? 21));
    setKeyVerse(selected.keyVerse ?? "");
    setStatus(selected.status === "legacy" ? "draft" : selected.status);
    setContentJson(selected.content ? JSON.stringify(selected.content, null, 2) : "");
    setJsonError("");
  }, [selected]);

  const save = useMutation({
    mutationFn: () => {
      let parsedContent: unknown = null;
      if (kind === "study" && contentJson.trim()) {
        try { parsedContent = JSON.parse(contentJson); }
        catch { setJsonError("O conteúdo precisa ser um JSON válido."); throw new Error("JSON inválido"); }
      }
      setJsonError("");
      return saveFn({ data: {
        kind, slug, title, category, reference, summary, depth,
        ...(kind === "prayer_plan" ? { days: Number(days), keyVerse } : {}),
        status, content: parsedContent,
      } });
    },
    onSuccess: async () => {
      setSelectedKey(`${kind}:${slug}`);
      await queryClient.invalidateQueries({ queryKey: ["admin-managed-content"] });
      await queryClient.invalidateQueries({ queryKey: ["published-managed-catalog"] });
      toast.success(status === "published" ? "Conteúdo publicado." : "Rascunho salvo.");
    },
    onError: (error) => {
      if (error.message !== "JSON inválido") toast.error(error.message || "Não foi possível salvar.");
    },
  });

  const studies = data.filter((item) => item.kind === "study");
  const plans = data.filter((item) => item.kind === "prayer_plan");

  return (
    <AppShell title="Biblioteca de conteúdo" subtitle="Gerencie estudos bíblicos e planos de oração sem editar arquivos do aplicativo.">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button asChild variant="ghost" size="sm"><Link to="/admin"><ArrowLeft className="mr-1 size-4" /> Painel</Link></Button>
        <span className="text-xs text-muted-foreground">{studies.length} estudos · {plans.length} planos</span>
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(240px,0.8fr)_minmax(0,1.5fr)]">
        <Card className="space-y-4 p-4">
          <div>
            <h2 className="font-display font-semibold">Estudos bíblicos</h2>
            <div className="mt-2 max-h-72 space-y-1 overflow-y-auto">
              {studies.map((item) => (
                <button key={item.slug} type="button" onClick={() => setSelectedKey(`study:${item.slug}`)}
                  className={`w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted ${selectedKey === `study:${item.slug}` ? "bg-muted" : ""}`}>
                  <span className="block font-medium">{item.title}</span>
                  <span className="text-xs text-muted-foreground">{item.reference} · {item.status}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <h2 className="font-display font-semibold">Planos de oração</h2>
            <div className="mt-2 max-h-72 space-y-1 overflow-y-auto">
              {plans.map((item) => (
                <button key={item.slug} type="button" onClick={() => setSelectedKey(`prayer_plan:${item.slug}`)}
                  className={`w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted ${selectedKey === `prayer_plan:${item.slug}` ? "bg-muted" : ""}`}>
                  <span className="block font-medium">{item.title}</span>
                  <span className="text-xs text-muted-foreground">{item.days} dias · {item.status}</span>
                </button>
              ))}
            </div>
          </div>
          {isLoading ? <p className="text-sm text-muted-foreground">Carregando catálogo…</p> : null}
        </Card>

        <Card className="space-y-4 p-5">
          {selected ? (
            <>
              <div className="flex items-center gap-2">
                <BookOpen className="size-5 text-primary" />
                <div><h2 className="font-display font-semibold">Editar conteúdo</h2><p className="text-xs text-muted-foreground">O conteúdo legado permanece como alternativa até a publicação da versão gerenciada.</p></div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm">Tipo
                  <select value={kind} disabled className="mt-1 w-full rounded-md border bg-background p-2">
                    <option value="study">Estudo bíblico</option><option value="prayer_plan">Plano de oração</option>
                  </select>
                </label>
                <label className="text-sm">Status
                  <select value={status} onChange={(e) => setStatus(e.target.value as "draft" | "published" | "archived")} className="mt-1 w-full rounded-md border bg-background p-2">
                    <option value="draft">Rascunho</option><option value="published">Publicado</option><option value="archived">Arquivado</option>
                  </select>
                </label>
                <label className="text-sm">Slug (identificador) <Input className="mt-1" value={slug} onChange={(e) => setSlug(e.target.value)} /></label>
                <label className="text-sm">Título <Input className="mt-1" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
                <label className="text-sm">Categoria <Input className="mt-1" value={category} onChange={(e) => setCategory(e.target.value)} /></label>
                <label className="text-sm">Referência bíblica <Input className="mt-1" value={reference} onChange={(e) => setReference(e.target.value)} /></label>
              </div>
              <label className="block text-sm">Resumo <Textarea className="mt-1" rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} /></label>
              {kind === "study" ? (
                <>
                  <label className="block text-sm">Profundidade
                    <select value={depth} onChange={(e) => setDepth(e.target.value as "simple" | "deep")} className="mt-1 w-full rounded-md border bg-background p-2">
                      <option value="simple">Simples</option><option value="deep">Aprofundado</option>
                    </select>
                  </label>
                  <label className="block text-sm">Conteúdo completo do estudo (JSON opcional)
                    <Textarea className="mt-1 font-mono text-xs" rows={12} value={contentJson} onChange={(e) => setContentJson(e.target.value)} placeholder={'{"version":1,"depth":"deep","sections":[{"id":"intro","title":"Introdução","body":"..."}]}'}/>
                  </label>
                  {jsonError ? <p className="text-sm text-destructive">{jsonError}</p> : null}
                  <p className="text-xs text-muted-foreground">Se deixar vazio, o estudo continua usando o conteúdo revisado local ou a geração atual. Para substituir o texto completo, informe um objeto JSON compatível com StudyContent.</p>
                </>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-sm">Duração (dias) <Input className="mt-1" type="number" min="1" max="400" value={days} onChange={(e) => setDays(e.target.value)} /></label>
                  <label className="text-sm">Versículo-chave <Input className="mt-1" value={keyVerse} onChange={(e) => setKeyVerse(e.target.value)} /></label>
                  <p className="text-xs text-muted-foreground sm:col-span-2">Os textos diários continuam sendo gerados e armazenados pelo mecanismo atual. A edição de cada dia será uma etapa separada.</p>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2 border-t pt-4">
                <Button onClick={() => save.mutate()} disabled={save.isPending || !slug || !title || !category || !summary}>
                  <Save className="mr-2 size-4" /> {save.isPending ? "Salvando…" : status === "published" ? "Salvar e publicar" : "Salvar alterações"}
                </Button>
                <span className="text-xs text-muted-foreground">Publicar substitui a versão local para os alunos. Rascunhos não ficam visíveis.</span>
              </div>
            </>
          ) : <p className="text-sm text-muted-foreground">Selecione um estudo ou plano para editar.</p>}
        </Card>
      </div>
    </AppShell>
  );
}
