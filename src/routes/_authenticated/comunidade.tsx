import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { BookOpen, Check, Download, FileText, Flag, Heart, LibraryBig, Loader2, MessageCircle, MessagesSquare, Plus, Send, ShieldCheck, Sparkles, Upload, UsersRound, X, ExternalLink } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { validateCommunityPdf } from "@/lib/community-pdf-validation";
import { CommunityChat } from "@/components/community/CommunityChat";

const db = supabase as unknown as SupabaseClient;
type Category = "pergunta" | "debate" | "estudo" | "testemunho" | "oracao" | "reflexao";
type Post = { id: string; user_id: string; category: Category; title: string; body: string; scripture_reference: string | null; created_at: string };
type Resource = { id: string; user_id: string; title: string; author: string; description: string; category: string; storage_path: string; file_name: string; file_size: number; status: "pending" | "approved" | "rejected"; course_candidate?: boolean; created_at: string };
type Profile = { id: string; display_name: string | null; avatar_url: string | null };
type Comment = { id: string; post_id: string; user_id: string; body: string; created_at: string };
const labels: Record<Category, string> = { pergunta: "Pergunta bíblica", debate: "Debate da fé", estudo: "Estudo compartilhado", testemunho: "Testemunho", oracao: "Pedido de oração", reflexao: "Reflexão" };
const resourceCategories = [{ value: "estudo", label: "Estudo bíblico" }, { value: "comentario", label: "Comentário bíblico" }, { value: "teologia", label: "Teologia" }, { value: "historia", label: "História e contexto" }, { value: "devocional", label: "Devocional" }, { value: "outro", label: "Outro material" }];
const initials = (name?: string | null) => (name || "Membro").trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
const age = (value: string) => { const m = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 60000)); return m < 60 ? `há ${m} min` : m < 1440 ? `há ${Math.floor(m / 60)} h` : `há ${Math.floor(m / 1440)} dia(s)`; };
const sizeLabel = (bytes: number) => bytes < 1048576 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1048576).toFixed(1)} MB`;

function MemberAvatar({ profile, name, size = "size-11" }: { profile: Profile | undefined; name?: string | null; size?: string }) {
  return (
    <Avatar className={`${size} shrink-0 border-2 border-white shadow-sm`}>
      <AvatarImage src={profile?.avatar_url ?? undefined} alt="" />
      <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
        {initials(profile?.display_name || name)}
      </AvatarFallback>
    </Avatar>
  );
}

export const Route = createFileRoute("/_authenticated/comunidade")({
  head: () => ({ meta: [{ title: "Comunidade — Caminho Divino" }, { name: "description", content: "Cresça na Palavra, compartilhe estudos, ore e caminhe com a comunidade." }, { property: "og:title", content: "Comunidade — Caminho Divino" }, { property: "og:description", content: "Chat, oração e estudos compartilhados entre membros." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: ComunidadePage,
});

function ComunidadePage() {
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [pendingPosts, setPendingPosts] = useState<Post[]>([]);
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
  const [expandedText, setExpandedText] = useState<string | null>(null);
  const [pollChoice, setPollChoice] = useState("");
  const [pollVoted, setPollVoted] = useState(false);
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
  const [courseCandidate, setCourseCandidate] = useState(false);
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
      const currentCount = counts[item.post_id] ?? { count: 0, mine: false };
      currentCount.count += 1;
      if (item.user_id === current.id) currentCount.mine = true;
      counts[item.post_id] = currentCount;
    }
    setLikes(counts);
    const isAdmin = Boolean(a.data && !a.error); setAdmin(isAdmin);
    const ids = [
      ...new Set([
        current.id,
        ...[...rows, ...((r.data || []) as Resource[])].map((row) => row.user_id),
      ]),
    ];
    if (ids.length) {
      const { data } = await db.from("community_member_profiles").select("id,display_name,avatar_url").in("id", ids);
      setProfiles(Object.fromEntries(((data || []) as Profile[]).map((x) => [x.id, x])));
    }
    if (isAdmin) {
      const [{ data: pendingResources }, { data: postsAwaitingReview }] = await Promise.all([
        db.from("community_resources").select("*").eq("status", "pending").order("created_at"),
        db.from("community_posts").select("*").eq("status", "pending").order("created_at"),
      ]);
      setPending((pendingResources || []) as Resource[]);
      setPendingPosts((postsAwaitingReview || []) as Post[]);
    } else { setPending([]); setPendingPosts([]); }
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
    if (tab === "arquivos") return [];
    if (tab === "forum") return posts.filter((p) => p.category === "pergunta" || p.category === "debate" || p.category === "reflexao");
    return posts;
  }, [posts, tab]);

  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!user) return; setBusy(true);
    const { count, error: countError } = await db.from("community_posts").select("id", { count: "exact", head: true }).eq("user_id", user.id);
    if (countError) { setBusy(false); toast.error("Não foi possível verificar sua primeira publicação."); return; }
    const status = count === 0 ? "pending" : "published";
    const { error } = await db.from("community_posts").insert({ user_id: user.id, category, title: title.trim(), body: body.trim(), scripture_reference: reference.trim() || null, status });
    setBusy(false);
    if (error) { toast.error("Não foi possível publicar. Confira os campos e tente novamente."); return; }
    toast.success(status === "pending" ? "Sua primeira publicação foi enviada para aprovação da equipe." : "Publicação compartilhada. Que ela edifique a comunidade!");
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
    if (ids.length) { const { data: people } = await db.from("community_member_profiles").select("id,display_name,avatar_url").in("id", ids); setProfiles((old) => ({ ...old, ...Object.fromEntries(((people || []) as Profile[]).map((x) => [x.id, x])) })); }
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
    const validation = await validateCommunityPdf(pdf);
    if (!validation.valid) { toast.error(validation.message); return; }
    if (!rights) { toast.error("Confirme que possui autorização para compartilhar o material."); return; }
    setBusy(true);
    const path = `${user.id}/${crypto.randomUUID()}.pdf`;
    const { error: uploadError } = await db.storage.from("community-library").upload(path, pdf, { contentType: "application/pdf", upsert: false });
    if (uploadError) { setBusy(false); toast.error("Falha ao enviar o PDF. Tente novamente."); return; }
    const { error } = await db.from("community_resources").insert({ user_id: user.id, title: bookTitle.trim(), author: author.trim(), description: description.trim(), category: bookCategory, storage_path: path, file_name: pdf.name, file_size: pdf.size, rights_confirmed: true, course_candidate: courseCandidate, status: "pending" });
    if (error) { await db.storage.from("community-library").remove([path]); setBusy(false); toast.error("Não foi possível registrar a contribuição."); return; }
    setBusy(false); toast.success("PDF enviado para análise. Ele ficará privado até ser aprovado.");
    setBookTitle(""); setAuthor(""); setDescription(""); setPdf(null); setRights(false); setCourseCandidate(false); setLibraryForm(false); await reload(user);
  }

  async function moderatePost(post: Post, approved: boolean) {
    if (!user || !admin) return;
    const { error } = await db.from("community_posts").update({ status: approved ? "published" : "hidden" }).eq("id", post.id);
    if (error) { toast.error("Não foi possível moderar a publicação."); return; }
    toast.success(approved ? "Publicação aprovada e visível na comunidade." : "Publicação recusada.");
    await reload(user);
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

  const name = user?.user_metadata?.["display_name"] || user?.user_metadata?.["full_name"] || user?.email?.split("@")[0] || "Membro";

  return (
    <AppShell
      title="Comunidade"
      subtitle="Crescendo juntos no conhecimento de Deus."
    >
      <CommunityChat />
      <div className="mx-auto max-w-7xl space-y-4 pb-2 lg:space-y-5">
        <section className="overflow-hidden rounded-[1.75rem] border border-primary/10 bg-white shadow-soft dark:bg-card">
          <div className="grid min-h-[190px] items-center gap-4 p-5 sm:grid-cols-[1fr_0.82fr] sm:p-7 lg:min-h-[230px] lg:gap-8 lg:p-9">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <UsersRound className="size-3.5" /> Crescendo juntos
              </span>
              <h2 className="mt-3 font-display text-4xl font-semibold leading-none tracking-tight text-[#142d59] dark:text-foreground sm:text-5xl lg:text-6xl">
                Comunidade
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-muted-foreground sm:text-base">
                Crescendo juntos no conhecimento de Deus
              </p>
              <a
                href="https://chat.whatsapp.com/KXe3BvJqUyJ2sX5NAShfPi?s=cl&p=i&mlu=4&ilr=4&iam=2"
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100"
              >
                <MessageCircle className="size-4" /> Grupo no WhatsApp{" "}
                <ExternalLink className="size-3" />
              </a>
            </div>
            <div className="community-scripture relative flex min-h-[145px] flex-col justify-center overflow-hidden rounded-2xl p-5 text-white sm:min-h-[160px] lg:min-h-[180px] lg:p-7">
              <p className="max-w-lg font-display text-lg italic leading-snug sm:text-xl lg:text-2xl">
                “Onde há dois ou três reunidos em meu nome, eu estou no meio
                deles.”
              </p>
              <p className="mt-2 text-xs font-bold uppercase tracking-wider text-amber-200">
                Mateus 18:20
              </p>
            </div>
          </div>
        </section>

        <section
          aria-label="Formas de participar"
          className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4"
        >
          {[
            {
              label: "Perguntas Bíblicas",
              detail: "Tire suas dúvidas e aprenda",
              icon: MessagesSquare,
              action: () => {
                setTab("forum");
                setCategory("pergunta");
                setComposer(true);
              },
            },
            {
              label: "Debates da Fé",
              detail: "Converse e compartilhe",
              icon: MessageCircle,
              action: () => {
                setTab("forum");
                setCategory("debate");
                setComposer(true);
              },
            },
            {
              label: "Compartilhar Livros e Recursos",
              detail: "Enriqueça a biblioteca",
              icon: LibraryBig,
              action: () => {
                setTab("arquivos");
                setLibraryForm(true);
              },
            },
            {
              label: "Testemunhos",
              detail: "Compartilhe o que Deus fez",
              icon: Heart,
              action: () => {
                setTab("testemunhos");
                setCategory("testemunho");
                setComposer(true);
              },
            },
          ].map(({ label, detail, icon: Icon, action }) => (
            <button
              key={label}
              type="button"
              onClick={action}
              className="community-category-card flex min-h-[132px] flex-col items-center justify-center rounded-2xl border border-border/70 bg-white p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md dark:bg-card lg:min-h-[172px] lg:p-6"
            >
              <Icon className="mb-2 size-9 text-primary" strokeWidth={1.8} />
              <span className="max-w-[15rem] font-semibold leading-tight text-[#142d59] dark:text-foreground">
                {label}
              </span>
              <span className="mt-1 text-xs leading-snug text-muted-foreground">
                {detail}
              </span>
            </button>
          ))}
        </section>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-2xl bg-muted/80 p-1">
            <TabsTrigger
              value="todos"
              className="min-h-11 shrink-0 rounded-xl px-4"
            >
              {" "}
              <UsersRound className="mr-2 size-4" />
              Todos
            </TabsTrigger>
            <TabsTrigger
              value="forum"
              className="min-h-11 shrink-0 rounded-xl px-4"
            >
              <MessagesSquare className="mr-2 size-4" />
              Fórum
            </TabsTrigger>
            <TabsTrigger
              value="estudos"
              className="min-h-11 shrink-0 rounded-xl px-4"
            >
              <BookOpen className="mr-2 size-4" />
              Estudos
            </TabsTrigger>
            <TabsTrigger
              value="arquivos"
              className="min-h-11 shrink-0 rounded-xl px-4"
            >
              <FileText className="mr-2 size-4" />
              Arquivos
            </TabsTrigger>
            <TabsTrigger
              value="testemunhos"
              className="min-h-11 shrink-0 rounded-xl px-4"
            >
              <Heart className="mr-2 size-4" />
              Testemunhos
            </TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-4 space-y-4">
            {tab !== "arquivos" && (
              <>
                <section className="community-hero relative overflow-hidden rounded-[1.6rem] border border-primary/20 p-5 text-white shadow-sm sm:p-6">
                  <div className="relative z-10 max-w-3xl">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-300 px-2.5 py-1 text-xs font-bold text-slate-900">
                      <Sparkles className="size-3.5" /> Em Destaque
                    </span>
                    <h3 className="mt-2 font-display text-xl font-semibold sm:text-2xl">
                      Tema do Dia: A Fé que Move Montanhas
                    </h3>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-blue-50">
                      “Porque, em verdade, se tiverdes fé e não duvidardes,
                      direis a este monte: Ergue-te e lança-te no mar, e assim
                      será feito.”{" "}
                      <span className="font-semibold text-white">
                        — Marcos 11:23
                      </span>
                    </p>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="mt-4 rounded-full px-5"
                      onClick={() => {
                        const target = posts.find((p) =>
                          /fé que move montanhas/i.test(p.title),
                        );
                        if (target) {
                          setExpanded(target.id);
                          document
                            .getElementById(`community-post-${target.id}`)
                            ?.scrollIntoView({
                              behavior: "smooth",
                              block: "center",
                            });
                        } else {
                          setCategory("debate");
                          setTitle("A Fé que Move Montanhas");
                          setReference("Marcos 11:23");
                          setComposer(true);
                        }
                      }}
                    >
                      Participar <span aria-hidden>→</span>
                    </Button>
                  </div>
                </section>

                <button
                  type="button"
                  onClick={() => setComposer((v) => !v)}
                  className="flex min-h-[66px] w-full items-center gap-3 rounded-2xl border border-border/70 bg-white px-4 text-left shadow-sm transition hover:border-primary/30 dark:bg-card sm:px-5"
                >
                  <MemberAvatar profile={profiles[user?.id ?? ""]} name={name} size="size-10" />
                  <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground sm:text-base">
                    Compartilhe uma palavra, pergunta ou reflexão...
                  </span>
                  <span className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
                    <FileText className="size-4" />
                    Escrever
                  </span>
                  <span className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground">
                    <Send className="size-4" />
                    <span className="hidden sm:inline">Publicar</span>
                  </span>
                </button>

                {composer && (
                  <Card className="border-primary/20 p-4 shadow-sm sm:p-5">
                    <form onSubmit={publish} className="space-y-3">
                      <div>
                        <h3 className="font-semibold">Nova publicação</h3>
                        <p className="text-xs text-muted-foreground">
                          Compartilhe uma palavra, pergunta ou reflexão com
                          respeito.
                        </p>
                      </div>
                      <label className="block space-y-1 text-sm font-medium">
                        Tipo de publicação
                        <select
                          value={category}
                          onChange={(e) =>
                            setCategory(e.target.value as Category)
                          }
                          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                        >
                          {Object.entries(labels).map(([v, label]) => (
                            <option key={v} value={v}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        minLength={4}
                        maxLength={160}
                        placeholder="Dê um título à sua publicação"
                        required
                      />
                      <Textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        minLength={10}
                        maxLength={8000}
                        rows={5}
                        placeholder="Escreva sua pergunta, reflexão, testemunho ou pedido de oração..."
                        required
                      />
                      <Input
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        maxLength={120}
                        placeholder="Referência bíblica (opcional) — Ex.: João 15:1–8"
                      />
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="max-w-md text-xs text-muted-foreground">
                          Diferencie o que o texto bíblico afirma da sua
                          interpretação e aplicação.
                        </p>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setComposer(false)}
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="submit"
                            disabled={busy || !user}
                            className="gap-2"
                          >
                            {busy ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Send className="size-4" />
                            )}
                            Publicar
                          </Button>
                        </div>
                      </div>
                    </form>
                  </Card>
                )}

                <div className="space-y-3">
                  <div className="flex items-end justify-between gap-3 px-1">
                    <div>
                      <h3 className="font-display text-xl font-semibold">
                        Publicações da comunidade
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Perguntas, estudos e testemunhos compartilhados.
                      </p>
                    </div>
                    {!loading && (
                      <span className="text-xs text-muted-foreground">
                        {shownPosts.length} publicação(ões)
                      </span>
                    )}
                  </div>
                  {loading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="size-7 animate-spin text-primary" />
                    </div>
                  ) : shownPosts.length === 0 ? (
                    <Card className="p-8 text-center">
                      <MessagesSquare className="mx-auto size-9 text-muted-foreground" />
                      <h3 className="mt-3 font-semibold">
                        Seja o primeiro a contribuir
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Compartilhe uma pergunta ou reflexão fundamentada na
                        Palavra.
                      </p>
                      <Button
                        className="mt-4"
                        onClick={() => setComposer(true)}
                      >
                        Criar publicação
                      </Button>
                    </Card>
                  ) : (
                    shownPosts.map((post) => {
                      const profile = profiles[post.user_id];
                      const reaction = likes[post.id] || {
                        count: 0,
                        mine: false,
                      };
                      return (
                        <Card
                          id={`community-post-${post.id}`}
                          key={post.id}
                          className="overflow-hidden rounded-2xl border-border/70 p-4 shadow-sm sm:p-5"
                        >
                          <div className="flex items-start gap-3">
                            <MemberAvatar
                              profile={profile}
                              name={post.user_id === user?.id ? name : null}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-semibold">
                                  {profile?.display_name ||
                                    (post.user_id === user?.id
                                      ? name
                                      : "Membro da comunidade")}
                                </span>
                                {post.user_id === user?.id && (
                                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                                    Você
                                  </span>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {age(post.created_at)}
                                </span>
                              </div>
                              <span className="mt-1 inline-flex rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium">
                                {labels[post.category]}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => void report(post.id)}
                              className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
                              aria-label="Sinalizar publicação"
                            >
                              <Flag className="size-4" />
                            </button>
                          </div>
                          <div className="mt-3">
                            <h3 className="text-lg font-semibold leading-snug text-[#142d59] dark:text-foreground">
                              {post.title}
                            </h3>
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
                              {expandedText === post.id ||
                              post.body.length <= 260
                                ? post.body
                                : `${post.body.slice(0, 260).trimEnd()}…`}{" "}
                              {post.body.length > 260 && (
                                <button
                                  type="button"
                                  className="font-semibold text-primary"
                                  onClick={() =>
                                    setExpandedText(
                                      expandedText === post.id ? null : post.id,
                                    )
                                  }
                                >
                                  {expandedText === post.id
                                    ? "Ler menos"
                                    : "Ler mais"}
                                </button>
                              )}
                            </p>
                          </div>
                          {post.scripture_reference && (
                            <div className="mt-3 flex items-center gap-3 rounded-xl border border-primary/10 bg-primary/[0.035] p-3">
                              <BookOpen className="size-5 shrink-0 text-primary" />
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                  Referência bíblica
                                </p>
                                <p className="text-sm font-semibold text-primary">
                                  {post.scripture_reference}
                                </p>
                              </div>
                            </div>
                          )}
                          <div className="mt-4 flex flex-wrap items-center gap-5 border-t border-border/70 pt-3">
                            <button
                              type="button"
                              onClick={() => void react(post.id)}
                              className={`inline-flex items-center gap-1.5 text-sm ${reaction.mine ? "font-semibold text-primary" : "text-muted-foreground hover:text-primary"}`}
                            >
                              <Heart
                                className={`size-4 ${reaction.mine ? "fill-current" : ""}`}
                              />
                              {reaction.count} Edificou
                            </button>
                            <button
                              type="button"
                              onClick={() => void toggleComments(post.id)}
                              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
                            >
                              <MessageCircle className="size-4" />
                              Conversar
                            </button>
                          </div>
                          {expanded === post.id && (
                            <div className="mt-3 space-y-3 rounded-xl bg-muted/40 p-3">
                              {(comments[post.id] || []).map((c) => (
                                <div key={c.id} className="flex gap-2 text-sm">
                                  <MemberAvatar
                                    profile={profiles[c.user_id]}
                                    name={c.user_id === user?.id ? name : null}
                                    size="size-7"
                                  />
                                  <div className="min-w-0 flex-1 rounded-lg bg-background p-2">
                                    <p className="text-xs font-semibold">
                                      {profiles[c.user_id]?.display_name ||
                                        (c.user_id === user?.id
                                          ? name
                                          : "Membro")}
                                    </p>
                                    <p className="mt-1 whitespace-pre-wrap">
                                      {c.body}
                                    </p>
                                  </div>
                                </div>
                              ))}
                              <div className="flex gap-2">
                                <Input
                                  value={drafts[post.id] || ""}
                                  onChange={(e) =>
                                    setDrafts((old) => ({
                                      ...old,
                                      [post.id]: e.target.value,
                                    }))
                                  }
                                  placeholder="Escreva uma resposta respeitosa..."
                                  maxLength={2000}
                                />
                                <Button
                                  size="icon"
                                  onClick={() => void comment(post.id)}
                                  aria-label="Enviar comentário"
                                >
                                  <Send className="size-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </Card>
                      );
                    })
                  )}
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <Card className="space-y-3 rounded-2xl p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display text-lg font-semibold">
                        Enquetes da Comunidade
                      </h3>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                        Ativa até 12/11
                      </span>
                    </div>
                    <p className="text-sm font-medium">
                      Qual livro da Bíblia você mais ama?
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {["João", "Salmos", "Romanos", "Provérbios"].map(
                        (option) => (
                          <label
                            key={option}
                            className="flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5 text-sm transition hover:border-primary/40"
                          >
                            <input
                              type="radio"
                              name="community-poll"
                              value={option}
                              checked={pollChoice === option}
                              onChange={(e) => {
                                setPollChoice(e.target.value);
                                setPollVoted(false);
                              }}
                              className="accent-primary"
                            />
                            {option}
                          </label>
                        ),
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <UsersRound className="size-4" />
                        142 participantes
                      </span>
                      <Button
                        size="sm"
                        disabled={!pollChoice || pollVoted}
                        onClick={() => {
                          setPollVoted(true);
                          toast.success("Voto registrado nesta sessão.");
                        }}
                      >
                        {pollVoted ? "Voto registrado" : "Votar →"}
                      </Button>
                    </div>
                  </Card>
                  <Card className="space-y-3 rounded-2xl border-amber-200/70 bg-gradient-to-br from-amber-50 to-white p-4 dark:from-amber-950/20 dark:to-card sm:p-5">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-amber-100 p-2 text-amber-700">
                        <Sparkles className="size-5" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                          Desafio Bíblico da Semana
                        </span>
                        <h3 className="font-display text-lg font-semibold">
                          Leia e medite em Salmos 23
                        </h3>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Compartilhe sua reflexão e receba encorajamento da
                      comunidade.
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-primary">
                        68% concluído
                      </span>
                      <span className="text-muted-foreground">
                        Progresso da comunidade
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-primary/10">
                      <div className="h-full w-[68%] rounded-full bg-primary" />
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        setTab("estudos");
                        setCategory("estudo");
                        setTitle("Minha reflexão sobre Salmos 23");
                        setReference("Salmos 23");
                        setComposer(true);
                        setBody(
                          "O que mais chamou minha atenção neste salmo foi...",
                        );
                      }}
                    >
                      Participar →
                    </Button>
                  </Card>
                </div>
              </>
            )}

            {tab === "arquivos" && (
              <div className="space-y-5">
                <Card className="border-primary/15 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 dark:from-blue-950/40 dark:to-slate-900">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-primary/10 p-3 text-primary">
                      <LibraryBig className="size-7" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display text-xl font-semibold">
                        Biblioteca colaborativa
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Compartilhe materiais que ajudem a comunidade a estudar
                        a Bíblia com responsabilidade. Todo arquivo passa pela
                        análise da equipe antes de ficar disponível.
                      </p>
                      <Button
                        className="mt-4 gap-2"
                        onClick={() => setLibraryForm((v) => !v)}
                      >
                        <Upload className="size-4" />
                        Compartilhar Livros e Recursos
                      </Button>
                    </div>
                  </div>
                </Card>
                {libraryForm && (
                  <Card className="p-4 shadow-sm sm:p-5">
                    <form onSubmit={submitPdf} className="space-y-3">
                      <div>
                        <h3 className="font-semibold">
                          Enviar material para análise
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          PDF de até 15 MB. O arquivo ficará privado até ser
                          aprovado.
                        </p>
                      </div>
                      <Input
                        value={bookTitle}
                        onChange={(e) => setBookTitle(e.target.value)}
                        minLength={3}
                        maxLength={180}
                        placeholder="Título do livro ou arquivo"
                        required
                      />
                      <Input
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        minLength={2}
                        maxLength={160}
                        placeholder="Autor ou responsável"
                        required
                      />
                      <label className="block space-y-1 text-sm font-medium">
                        Categoria
                        <select
                          value={bookCategory}
                          onChange={(e) => setBookCategory(e.target.value)}
                          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                        >
                          {resourceCategories.map((item) => (
                            <option key={item.value} value={item.value}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        minLength={10}
                        maxLength={2000}
                        rows={3}
                        placeholder="Por que este material edifica a comunidade?"
                        required
                      />
                      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-3 text-sm">
                        <FileText className="size-5 text-primary" />
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium">
                            {pdf?.name || "Selecionar arquivo PDF"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {pdf
                              ? sizeLabel(pdf.size)
                              : "Somente PDF • máximo 15 MB"}
                          </span>
                        </span>
                        <input
                          type="file"
                          accept="application/pdf,.pdf"
                          className="sr-only"
                          onChange={(e) => setPdf(e.target.files?.[0] || null)}
                        />
                      </label>
                      <label className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={courseCandidate}
                          onChange={(e) => setCourseCandidate(e.target.checked)}
                          className="mt-0.5 size-4 accent-primary"
                        />
                        Sugiro este material para avaliação como possível base
                        de um futuro curso no Caminho Divino.
                      </label>
                      <label className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={rights}
                          onChange={(e) => setRights(e.target.checked)}
                          className="mt-0.5 size-4 accent-primary"
                        />
                        Confirmo que sou autor ou tenho autorização para
                        compartilhar este arquivo e que o envio respeita os
                        direitos autorais. Entendo que a equipe poderá recusar
                        materiais sem permissão de distribuição.
                      </label>
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setLibraryForm(false)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          disabled={busy || !rights || !pdf}
                          className="gap-2"
                        >
                          {busy ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Upload className="size-4" />
                          )}
                          Enviar para análise
                        </Button>
                      </div>
                    </form>
                  </Card>
                )}
                {loading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="size-7 animate-spin text-primary" />
                  </div>
                ) : resources.length === 0 ? (
                  <Card className="p-8 text-center">
                    <BookOpen className="mx-auto size-9 text-muted-foreground" />
                    <h3 className="mt-3 font-semibold">
                      A biblioteca está começando
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Os materiais aprovados pela equipe aparecerão aqui.
                    </p>
                  </Card>
                ) : (
                  resources.map((r) => (
                    <Card
                      key={r.id}
                      className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
                    >
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-600">
                        <FileText className="size-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold">{r.title}</h3>
                        <p className="text-xs text-muted-foreground">
                          {r.author} • {sizeLabel(Number(r.file_size))} •
                          Indicado por{" "}
                          {profiles[r.user_id]?.display_name ||
                            "Membro da comunidade"}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {r.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {r.file_name}
                        </p>
                        <span className="mt-2 inline-block rounded-full bg-secondary px-2 py-1 text-[10px] font-medium">
                          {resourceCategories.find(
                            (x) => x.value === r.category,
                          )?.label || "Material bíblico"}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => void download(r)}
                      >
                        <Download className="size-4" />
                        Abrir PDF
                      </Button>
                    </Card>
                  ))
                )}
                {admin && (
                  <section className="space-y-3 border-t border-border pt-5">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="size-5 text-primary" />
                      <h3 className="font-semibold">
                        Moderação de primeiras publicações
                      </h3>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                        {pendingPosts.length} pendente(s)
                      </span>
                    </div>
                    {pendingPosts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Não há publicações aguardando análise.
                      </p>
                    ) : (
                      pendingPosts.map((post) => (
                        <Card key={post.id} className="space-y-3 p-4">
                          <div>
                            <h4 className="font-semibold">{post.title}</h4>
                            <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                              {post.body}
                            </p>
                            <p className="mt-2 text-xs text-muted-foreground">
                              {labels[post.category]} • {age(post.created_at)}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              onClick={() => void moderatePost(post, true)}
                            >
                              <Check className="mr-1 size-4" />
                              Aprovar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void moderatePost(post, false)}
                            >
                              <X className="mr-1 size-4" />
                              Reprovar
                            </Button>
                          </div>
                        </Card>
                      ))
                    )}
                  </section>
                )}
                {admin && (
                  <section className="space-y-3 border-t border-border pt-5">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="size-5 text-primary" />
                      <h3 className="font-semibold">Moderação da biblioteca</h3>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                        {pending.length} pendente(s)
                      </span>
                    </div>
                    {pending.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Não há materiais aguardando análise.
                      </p>
                    ) : (
                      pending.map((r) => (
                        <Card key={r.id} className="space-y-3 p-4">
                          <div>
                            <h4 className="font-semibold">{r.title}</h4>
                            <p className="text-xs text-muted-foreground">
                              {r.author} • {r.file_name} •{" "}
                              {sizeLabel(Number(r.file_size))}
                            </p>
                            <p className="mt-2 text-sm">{r.description}</p>
                            {r.course_candidate && (
                              <span className="mt-2 inline-flex rounded-full bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary">
                                Sugerido para futuro curso
                              </span>
                            )}
                          </div>
                          <Input
                            value={notes[r.id] || ""}
                            onChange={(e) =>
                              setNotes((old) => ({
                                ...old,
                                [r.id]: e.target.value,
                              }))
                            }
                            placeholder="Observação da equipe (opcional)"
                          />
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              onClick={() => void moderate(r, "approved")}
                              className="gap-1"
                            >
                              <Check className="size-4" />
                              Aprovar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void moderate(r, "rejected")}
                              className="gap-1"
                            >
                              <X className="size-4" />
                              Recusar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => void download(r)}
                              className="gap-1"
                            >
                              <Download className="size-4" />
                              Analisar PDF
                            </Button>
                          </div>
                        </Card>
                      ))
                    )}
                  </section>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Card className="border-border/60 bg-muted/30 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <h3 className="text-sm font-semibold">
                Um espaço de respeito e edificação
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Conversem com mansidão, examinem tudo à luz das Escrituras e não
                transformem opiniões pessoais em doutrinas. Não são permitidos
                ataques, discriminação, spam, exposição de dados pessoais ou
                materiais sem autorização. A equipe pode moderar conteúdos que
                desrespeitem estas orientações.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
