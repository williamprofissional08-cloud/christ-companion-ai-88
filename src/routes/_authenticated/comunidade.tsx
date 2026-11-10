import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { BookOpen, BookMarked, Check, CircleHelp, Download, FileText, Flag, Heart, HandHeart, LibraryBig, Loader2, MessageCircle, MessagesSquare, Plus, Send, ShieldCheck, Sparkles, Upload, UsersRound, X } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as unknown as SupabaseClient;
const MAX_PDF_SIZE = 15 * 1024 * 1024;
type Category = "pergunta" | "debate" | "estudo" | "testemunho" | "oracao" | "reflexao";
type Post = { id: string; user_id: string; category: Category; title: string; body: string; scripture_reference: string | null; created_at: string };
type Resource = { id: string; user_id: string; title: string; author: string; description: string; category: string; storage_path: string; file_name: string; file_size: number; status: "pending" | "approved" | "rejected"; created_at: string };
type Profile = { id: string; display_name: string | null };
type Comment = { id: string; post_id: string; user_id: string; body: string; created_at: string };
const labels: Record<Category, string> = { pergunta: "Pergunta bíblica", debate: "Debate da fé", estudo: "Estudo compartilhado", testemunho: "Testemunho", oracao: "Pedido de oração", reflexao: "Reflexão" };
const resourceCategories = [{ value: "estudo", label: "Estudo bíblico" }, { value: "comentario", label: "Comentário bíblico" }, { value: "teologia", label: "Teologia" }, { value: "historia", label: "História e contexto" }, { value: "devocional", label: "Devocional" }, { value: "outro", label: "Outro material" }];
const initials = (name?: string | null) => (name || "Membro").trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
const age = (value: string) => { const m = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 60000)); return m < 60 ? `há ${m} min` : m < 1440 ? `há ${Math.floor(m / 60)} h` : `há ${Math.floor(m / 1440)} dia(s)`; };
const sizeLabel = (bytes: number) => bytes < 1048576 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1048576).toFixed(1)} MB`;

export const Route = createFileRoute("/_authenticated/comunidade")({
  head: () => ({ meta: [{ title: "Comunidade — Caminho Divino" }, { name: "description", content: "Cresça na Palavra, compartilhe estudos, ore e caminhe com a comunidade." }] }),
  component: ComunidadePage,
});

function ComunidadePage() {
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [pending, setPending] = useState<Resource[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [likes, setLikes] = useState<Record<string, { count: number; mine: boolean }>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("todos");
  const [composer, setComposer] = useState(false);
  const [libraryForm, setLibraryForm] = useState(false);
  const [category, setCategory] = useState<Category>("pergunta");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [reference, setReference] = useState("");
  const [bookTitle, setBookTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [bookCategory, setBookCategory] = useState("estudo");
  const [pdf, setPdf] = useState<File | null>(null);
  const [rights, setRights] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const reload = useCallback(async (current: User) => {
    setLoading(true);
    const [p, r, l, a] = await Promise.all([
      db.from("community_posts").select("*").eq("status", "published").order("created_at", { ascending: false }).limit(50),
      db.from("community_resources").select("*").eq("status", "approved").order("created_at", { ascending: false }).limit(40),
      db.from("community_reactions").select("post_id,user_id"),
      db.rpc("is_admin"),
    ]);
    if (p.error) toast.error("Não foi possível carregar as publicações.");
    const rows = (p.data || []) as Post[];
    setPosts(rows); setResources((r.data || []) as Resource[]);
    const counts: Record<string, { count: number; mine: boolean }> = {};
    for (const item of (l.data || []) as { post_id: string; user_id: string }[]) {
      counts[item.post_id] ||= { count: 0, mine: false };
      counts[item.post_id].count++;
      if (item.user_id === current.id) counts[item.post_id].mine = true;
    }
    setLikes(counts);
    const isAdmin = Boolean(a.data && !a.error); setAdmin(isAdmin);
    const ids = [...new Set(rows.map((row) => row.user_id))];
    if (ids.length) {
      const { data } = await db.from("community_member_profiles").select("id,display_name").in("id", ids);
      setProfiles(Object.fromEntries(((data || []) as Profile[]).map((x) => [x.id, x])));
    }
    if (isAdmin) {
      const { data } = await db.from("community_resources").select("*").eq("status", "pending").order("created_at");
      setPending((data || []) as Resource[]);
    } else setPending([]);
    setLoading(false);
  }, []);

  useEffect(() => {
    let alive = true;
    db.auth.getUser().then(({ data }) => { if (alive && data.user) { setUser(data.user); void reload(data.user); } });
    return () => { alive = false; };
  }, [reload]);

  const shownPosts = useMemo(() => {
    if (tab === "forum") return posts.filter((p) => p.category === "pergunta" || p.category === "debate");
    if (tab === "estudos") return posts.filter((p) => p.category === "estudo");
    if (tab === "testemunhos") return posts.filter((p) => p.category === "testemunho");
    if (tab === "oracao") return posts.filter((p) => p.category === "oracao");
    return posts;
  }, [posts, tab]);

  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!user) return; setBusy(true);
    const { error } = await db.from("community_posts").insert({ user_id: user.id, category, title: title.trim(), body: body.trim(), scripture_reference: reference.trim() || null, status: "published" });
    setBusy(false);
    if (error) { toast.error("Não foi possível publicar. Confira os campos e tente novamente."); return; }
    toast.success("Publicação compartilhada. Que ela edifique a comunidade!");
    setTitle(""); setBody(""); setReference(""); setComposer(false); await reload(user);
  }

  async function react(postId: string) {
    if (!user) return;
    const mine = likes[postId]?.mine;
    const result = mine
      ? await db.from("community_reactions").delete().eq("post_id", postId).eq("user_id", user.id)
      : await db.from("community_reactions").insert({ post_id: postId, user_id: user.id });
    if (result.error) { toast.error("Não foi possível registrar sua reação."); return; }
    setLikes((old) => ({ ...old, [postId]: { count: Math.max(0, (old[postId]?.count || 0) + (mine ? -1 : 1)), mine: !mine } }));
  }

  async function toggleComments(postId: string) {
    if (expanded === postId) { setExpanded(null); return; }
    setExpanded(postId);
    const { data, error } = await db.from("community_comments").select("*").eq("post_id", postId).order("created_at");
    if (error) { toast.error("Não foi possível carregar as respostas."); return; }
    const rows = (data || []) as Comment[]; setComments((old) => ({ ...old, [postId]: rows }));
    const ids = [...new Set(rows.map((x) => x.user_id))];
    if (ids.length) { const { data: people } = await db.from("community_member_profiles").select("id,display_name").in("id", ids); setProfiles((old) => ({ ...old, ...Object.fromEntries(((people || []) as Profile[]).map((x) => [x.id, x])) })); }
  }

  async function comment(postId: string) {
    if (!user) return; const text = (drafts[postId] || "").trim(); if (text.length < 2) return;
    const { data, error } = await db.from("community_comments").insert({ post_id: postId, user_id: user.id, body: text }).select("*").single();
    if (error) { toast.error("Não foi possível enviar sua resposta."); return; }
    setComments((old) => ({ ...old, [postId]: [...(old[postId] || []), data as Comment] }));
    setDrafts((old) => ({ ...old, [postId]: "" }));
  }

  async function report(postId: string) {
    if (!user) return; const reason = window.prompt("Conte brevemente por que deseja sinalizar esta publicação:");
    if (!reason?.trim()) return;
    const { error } = await db.from("community_reports").insert({ reporter_id: user.id, post_id: postId, reason: reason.trim() });
    if (error) toast.error("Não foi possível enviar a sinalização."); else toast.success("Sinalização enviada à equipe de moderação.");
  }

  async function submitPdf(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!user || !pdf) return;
    if (pdf.type !== "application/pdf" && !pdf.name.toLowerCase().endsWith(".pdf")) { toast.error("Envie somente arquivos PDF."); return; }
    if (pdf.size > MAX_PDF_SIZE) { toast.error("O PDF deve ter no máximo 15 MB."); return; }
    if (!rights) { toast.error("Confirme que possui autorização para compartilhar o material."); return; }
    setBusy(true);
    const path = `${user.id}/${crypto.randomUUID()}.pdf`;
    const { error: uploadError } = await db.storage.from("community-library").upload(path, pdf, { contentType: "application/pdf", upsert: false });
    if (uploadError) { setBusy(false); toast.error("Falha ao enviar o PDF. Tente novamente."); return; }
    const { error } = await db.from("community_resources").insert({ user_id: user.id, title: bookTitle.trim(), author: author.trim(), description: description.trim(), category: bookCategory, storage_path: path, file_name: pdf.name, file_size: pdf.size, rights_confirmed: true, status: "pending" });
    if (error) { await db.storage.from("community-library").remove([path]); setBusy(false); toast.error("Não foi possível registrar a contribuição."); return; }
    setBusy(false); toast.success("PDF enviado para análise. Ele ficará privado até ser aprovado.");
    setBookTitle(""); setAuthor(""); setDescription(""); setPdf(null); setRights(false); setLibraryForm(false); await reload(user);
  }

  async function moderate(resource: Resource, status: "approved" | "rejected") {
    if (!user) return;
    const { error } = await db.from("community_resources").update({ status, moderation_note: notes[resource.id]?.trim() || null, reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq("id", resource.id);
    if (error) { toast.error("Não foi possível concluir a análise."); return; }
    toast.success(status === "approved" ? "Material aprovado e disponível na biblioteca." : "Material recusado."); await reload(user);
  }

  async function download(resource: Resource) {
    const { data, error } = await db.storage.from("community-library").createSignedUrl(resource.storage_path, 60);
    if (error || !data?.signedUrl) { toast.error("Não foi possível abrir o arquivo."); return; }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  const name = user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Membro";

  return <AppShell title="Comunidade" subtitle="Crescendo juntos no conhecimento de Deus.">
    <div className="mx-auto max-w-4xl space-y-5">
      <section className="relative overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 p-5 text-slate-900 shadow-sm dark:from-slate-900 dark:via-blue-950 dark:to-slate-900 dark:text-white sm:p-7">
        <div className="absolute -right-8 -top-10 size-48 rounded-full bg-blue-300/25 blur-3xl" />
        <div className="relative flex items-start justify-between gap-4">
          <div><span className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/75 px-3 py-1 text-xs font-semibold text-blue-900 dark:bg-white/10 dark:text-blue-100"><UsersRound className="size-3.5" />Comunhão e crescimento</span>
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Comunidade</h2>
            <p className="mt-2 max-w-xl text-sm text-slate-700 dark:text-blue-100 sm:text-base">Um lugar para aprender a Palavra, orar uns pelos outros e compartilhar aquilo que nos aproxima de Cristo.</p>
          </div><BookOpen className="hidden size-10 text-blue-900 sm:block dark:text-blue-100" />
        </div>
        <div className="relative mt-5 rounded-2xl border border-white/70 bg-white/65 p-4 dark:border-white/10 dark:bg-white/10">
          <p className="font-display text-lg italic">“Onde estiverem dois ou três reunidos em meu nome, ali estou no meio deles.”</p><p className="mt-1 text-xs font-semibold text-blue-800 dark:text-blue-200">Mateus 18:20</p>
        </div>
      </section>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-2xl bg-muted/80 p-1 sm:grid-cols-6">
          <TabsTrigger value="todos" className="gap-1 rounded-xl py-2 text-xs sm:text-sm"><UsersRound className="size-4" />Todos</TabsTrigger>
          <TabsTrigger value="forum" className="gap-1 rounded-xl py-2 text-xs sm:text-sm"><MessagesSquare className="size-4" />Fórum</TabsTrigger>
          <TabsTrigger value="estudos" className="gap-1 rounded-xl py-2 text-xs sm:text-sm"><BookOpen className="size-4" />Estudos</TabsTrigger>
          <TabsTrigger value="arquivos" className="gap-1 rounded-xl py-2 text-xs sm:text-sm"><LibraryBig className="size-4" />Arquivos</TabsTrigger>
          <TabsTrigger value="testemunhos" className="gap-1 rounded-xl py-2 text-xs sm:text-sm"><Heart className="size-4" />Testemunhos</TabsTrigger>
          <TabsTrigger value="oracao" className="gap-1 rounded-xl py-2 text-xs sm:text-sm"><HandHeart className="size-4" />Oração</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4 space-y-5">
          {tab !== "arquivos" && <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: CircleHelp, title: "Perguntas bíblicas", sub: "Tire dúvidas com respeito", cat: "pergunta" as Category },
                { icon: MessagesSquare, title: "Debates da fé", sub: "Examine as Escrituras", cat: "debate" as Category },
                { icon: BookMarked, title: "Estudos", sub: "Compartilhe aprendizados", cat: "estudo" as Category },
                { icon: HandHeart, title: "Testemunhos e oração", sub: "Edifique e interceda", cat: "testemunho" as Category },
              ].map((item) => <button key={item.title} type="button" onClick={() => { setCategory(item.cat); setComposer(true); }} className="rounded-2xl border border-border/70 bg-card p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"><item.icon className="mb-2 size-6 text-primary" /><span className="block text-sm font-semibold">{item.title}</span><span className="mt-1 block text-xs text-muted-foreground">{item.sub}</span></button>)}
            </div>

            <Card className="border-primary/15 bg-gradient-to-r from-blue-950 to-blue-800 p-4 text-white shadow-sm sm:p-5">
              <div className="flex items-start gap-3"><div className="rounded-xl bg-white/15 p-2"><Sparkles className="size-5 text-amber-300" /></div><div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-200">Tema para refletir</p><h3 className="mt-1 font-display text-xl font-semibold">A fé que se expressa em amor</h3><p className="mt-1 text-sm text-blue-100">“A fé, se não tiver obras, por si só está morta.” — Tiago 2:17</p><p className="mt-2 text-xs text-blue-200">Como a fé em Cristo transforma nossas atitudes no dia a dia?</p>
                <Button size="sm" variant="secondary" className="mt-3" onClick={() => { setCategory("debate"); setTitle("Como a fé em Cristo transforma nossas atitudes?"); setReference("Tiago 2:14–18"); setComposer(true); }}>Participar da reflexão</Button>
              </div></div>
            </Card>

            <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-display text-xl font-semibold">Compartilhe com a comunidade</h3><p className="text-xs text-muted-foreground">Uma pergunta, aprendizado, oração ou testemunho.</p></div><Button onClick={() => setComposer((v) => !v)} className="gap-2">{composer ? <X className="size-4" /> : <Plus className="size-4" />}{composer ? "Fechar" : "Publicar"}</Button></div>

            {composer && <Card className="border-primary/20 p-4 shadow-sm sm:p-5"><form onSubmit={publish} className="space-y-3">
              <h3 className="font-semibold">Nova publicação</h3>
              <label className="block space-y-1 text-sm font-medium">Tipo de publicação<select value={category} onChange={(e) => setCategory(e.target.value as Category)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{Object.entries(labels).map(([v, label]) => <option key={v} value={v}>{label}</option>)}</select></label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} minLength={4} maxLength={160} placeholder="Dê um título à sua publicação" required />
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} minLength={10} maxLength={8000} rows={5} placeholder="Escreva sua pergunta, reflexão, testemunho ou pedido de oração..." required />
              <Input value={reference} onChange={(e) => setReference(e.target.value)} maxLength={120} placeholder="Referência bíblica (opcional) — Ex.: João 15:1–8" />
              <div className="flex flex-wrap items-center justify-between gap-2"><p className="max-w-md text-xs text-muted-foreground">Diferencie o que o texto bíblico afirma da sua interpretação e aplicação.</p><Button type="submit" disabled={busy || !user} className="gap-2">{busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}Publicar</Button></div>
            </form></Card>}

            {loading ? <div className="flex justify-center py-12"><Loader2 className="size-7 animate-spin text-primary" /></div> : shownPosts.length === 0 ? <Card className="p-8 text-center"><MessagesSquare className="mx-auto size-9 text-muted-foreground" /><h3 className="mt-3 font-semibold">Seja o primeiro a contribuir</h3><p className="mt-1 text-sm text-muted-foreground">Compartilhe uma pergunta ou reflexão fundamentada na Palavra.</p><Button className="mt-4" onClick={() => setComposer(true)}>Criar publicação</Button></Card> : shownPosts.map((post) => {
              const profile = profiles[post.user_id]; const reaction = likes[post.id] || { count: 0, mine: false };
              return <Card key={post.id} className="overflow-hidden border-border/70 p-4 shadow-sm sm:p-5">
                <div className="flex items-start gap-3"><div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{initials(profile?.display_name || (post.user_id === user?.id ? name : null))}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-semibold">{profile?.display_name || (post.user_id === user?.id ? name : "Membro da comunidade")}</span>{post.user_id === user?.id && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">Você</span>}<span className="text-xs text-muted-foreground">{age(post.created_at)}</span></div><span className="mt-1 inline-flex rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium">{labels[post.category]}</span></div><button type="button" onClick={() => void report(post.id)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label="Sinalizar publicação"><Flag className="size-4" /></button></div>
                <h3 className="mt-3 text-base font-semibold leading-snug">{post.title}</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">{post.body}</p>
                {post.scripture_reference && <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2 text-xs font-semibold text-primary"><BookOpen className="size-4" />{post.scripture_reference}</div>}
                <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-border/70 pt-3"><button type="button" onClick={() => void react(post.id)} className={`inline-flex items-center gap-1.5 text-sm ${reaction.mine ? "font-semibold text-primary" : "text-muted-foreground hover:text-primary"}`}><Heart className={`size-4 ${reaction.mine ? "fill-current" : ""}`} />{reaction.count} Edificou</button><button type="button" onClick={() => void toggleComments(post.id)} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"><MessageCircle className="size-4" />Conversar</button></div>
                {expanded === post.id && <div className="mt-3 space-y-3 rounded-xl bg-muted/40 p-3">{(comments[post.id] || []).map((c) => <div key={c.id} className="flex gap-2 text-sm"><div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-background text-[10px] font-semibold">{initials(profiles[c.user_id]?.display_name || (c.user_id === user?.id ? name : null))}</div><div className="min-w-0 flex-1 rounded-lg bg-background p-2"><p className="text-xs font-semibold">{profiles[c.user_id]?.display_name || (c.user_id === user?.id ? name : "Membro")}</p><p className="mt-1 whitespace-pre-wrap">{c.body}</p></div></div>)}<div className="flex gap-2"><Input value={drafts[post.id] || ""} onChange={(e) => setDrafts((old) => ({ ...old, [post.id]: e.target.value }))} placeholder="Escreva uma resposta respeitosa..." maxLength={2000} /><Button size="icon" onClick={() => void comment(post.id)} aria-label="Enviar comentário"><Send className="size-4" /></Button></div></div>}
              </Card>;
            })}
          </>}

          {tab === "arquivos" && <div className="space-y-5">
            <Card className="border-primary/15 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 dark:from-blue-950/40 dark:to-slate-900"><div className="flex items-start gap-3"><div className="rounded-xl bg-primary/10 p-3 text-primary"><LibraryBig className="size-7" /></div><div className="flex-1"><h3 className="font-display text-xl font-semibold">Biblioteca colaborativa</h3><p className="mt-1 text-sm text-muted-foreground">Compartilhe materiais que ajudem a comunidade a estudar a Bíblia com responsabilidade. Todo arquivo passa pela análise da equipe antes de ficar disponível.</p><Button className="mt-4 gap-2" onClick={() => setLibraryForm((v) => !v)}><Upload className="size-4" />Enviar um PDF</Button></div></div></Card>
            {libraryForm && <Card className="p-4 shadow-sm sm:p-5"><form onSubmit={submitPdf} className="space-y-3"><div><h3 className="font-semibold">Enviar material para análise</h3><p className="text-xs text-muted-foreground">PDF de até 15 MB. O arquivo ficará privado até ser aprovado.</p></div>
              <Input value={bookTitle} onChange={(e) => setBookTitle(e.target.value)} minLength={3} maxLength={180} placeholder="Título do livro ou material" required /><Input value={author} onChange={(e) => setAuthor(e.target.value)} minLength={2} maxLength={160} placeholder="Autor ou responsável" required />
              <label className="block space-y-1 text-sm font-medium">Categoria<select value={bookCategory} onChange={(e) => setBookCategory(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{resourceCategories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} minLength={10} maxLength={2000} rows={3} placeholder="Como este material pode contribuir para o estudo bíblico?" required />
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-3 text-sm"><FileText className="size-5 text-primary" /><span className="min-w-0 flex-1"><span className="block font-medium">{pdf?.name || "Selecionar arquivo PDF"}</span><span className="text-xs text-muted-foreground">{pdf ? sizeLabel(pdf.size) : "Somente PDF • máximo 15 MB"}</span></span><input type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(e) => setPdf(e.target.files?.[0] || null)} /></label>
              <label className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground"><input type="checkbox" checked={rights} onChange={(e) => setRights(e.target.checked)} className="mt-0.5 size-4 accent-primary" />Confirmo que sou autor ou tenho autorização para compartilhar este arquivo e que o envio respeita os direitos autorais. Entendo que a equipe poderá recusar materiais sem permissão de distribuição.</label>
              <div className="flex flex-wrap justify-end gap-2"><Button type="button" variant="outline" onClick={() => setLibraryForm(false)}>Cancelar</Button><Button type="submit" disabled={busy || !rights || !pdf} className="gap-2">{busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}Enviar para análise</Button></div>
            </form></Card>}
            {loading ? <div className="flex justify-center py-10"><Loader2 className="size-7 animate-spin text-primary" /></div> : resources.length === 0 ? <Card className="p-8 text-center"><BookOpen className="mx-auto size-9 text-muted-foreground" /><h3 className="mt-3 font-semibold">A biblioteca está começando</h3><p className="mt-1 text-sm text-muted-foreground">Os materiais aprovados pela equipe aparecerão aqui.</p></Card> : resources.map((r) => <Card key={r.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"><div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-600"><FileText className="size-6" /></div><div className="min-w-0 flex-1"><h3 className="font-semibold">{r.title}</h3><p className="text-xs text-muted-foreground">{r.author} • {sizeLabel(Number(r.file_size))}</p><p className="mt-1 text-sm text-muted-foreground">{r.description}</p><span className="mt-2 inline-block rounded-full bg-secondary px-2 py-1 text-[10px] font-medium">{resourceCategories.find((x) => x.value === r.category)?.label || "Material bíblico"}</span></div><Button variant="outline" className="gap-2" onClick={() => void download(r)}><Download className="size-4" />Abrir PDF</Button></Card>)}
            {admin && <section className="space-y-3 border-t border-border pt-5"><div className="flex items-center gap-2"><ShieldCheck className="size-5 text-primary" /><h3 className="font-semibold">Moderação da biblioteca</h3><span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{pending.length} pendente(s)</span></div>{pending.length === 0 ? <p className="text-sm text-muted-foreground">Não há materiais aguardando análise.</p> : pending.map((r) => <Card key={r.id} className="space-y-3 p-4"><div><h4 className="font-semibold">{r.title}</h4><p className="text-xs text-muted-foreground">{r.author} • {r.file_name} • {sizeLabel(Number(r.file_size))}</p><p className="mt-2 text-sm">{r.description}</p></div><Input value={notes[r.id] || ""} onChange={(e) => setNotes((old) => ({ ...old, [r.id]: e.target.value }))} placeholder="Observação da equipe (opcional)" /><div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => void moderate(r, "approved")} className="gap-1"><Check className="size-4" />Aprovar</Button><Button size="sm" variant="outline" onClick={() => void moderate(r, "rejected")} className="gap-1"><X className="size-4" />Recusar</Button><Button size="sm" variant="ghost" onClick={() => void download(r)} className="gap-1"><Download className="size-4" />Analisar PDF</Button></div></Card>)}</section>}
          </div>}
        </TabsContent>
      </Tabs>

      <Card className="border-border/60 bg-muted/30 p-4"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" /><div><h3 className="text-sm font-semibold">Um espaço de respeito e edificação</h3><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Conversem com mansidão, examinem tudo à luz das Escrituras e não transformem opiniões pessoais em doutrinas. Não são permitidos ataques, discriminação, spam, exposição de dados pessoais ou materiais sem autorização. A equipe pode moderar conteúdos que desrespeitem estas orientações.</p></div></div></Card>
    </div>
  </AppShell>;
}
