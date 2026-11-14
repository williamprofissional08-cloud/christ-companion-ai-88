import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen, Camera, ChevronRight, Crown, GraduationCap, Heart,
  Mic2, NotebookPen, Pencil, ShieldCheck, UserRound, UsersRound,
  ChartNoAxesColumnIncreasing, Cross, Settings2,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProfileEditor } from "@/components/settings/ProfileEditor";
import { listFavorites } from "@/lib/app.functions";
import { listCourses, listMyCourseProgress } from "@/lib/school.functions";
import { getPreacherCourseStats, listSermonMessages } from "@/lib/preacher-course.functions";

const panel = "overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white shadow-[0_4px_18px_rgba(19,52,93,.08)] dark:border-slate-700 dark:bg-card";
const focus = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2";

function ProfileLink({ to, icon: Icon, title, description }: {
  to: "/escola" | "/estudos" | "/diario" | "/favoritos" | "/minhas-mensagens" | "/comunidade";
  icon: typeof BookOpen; title: string; description: string;
}) {
  return (
    <Link to={to} className={`flex min-h-16 items-center gap-3 border-b border-slate-100 px-4 py-2.5 last:border-b-0 hover:bg-blue-50/70 dark:border-slate-700 dark:hover:bg-slate-800 ${focus}`}>
      <Icon className="size-6 shrink-0 text-[#0868aa]" aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-[#10254b] dark:text-foreground">{title}</span>
        <span className="block text-xs text-slate-600 dark:text-slate-300">{description}</span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-slate-500" aria-hidden="true" />
    </Link>
  );
}

export function ProfileOverview({ onOpenSettings }: { onOpenSettings: () => void }) {
  const { user } = useAuth();
  const [showEditor, setShowEditor] = useState(false);
  const userId = user?.id;
  const favoritesFn = useServerFn(listFavorites);
  const progressFn = useServerFn(listMyCourseProgress);
  const messagesFn = useServerFn(listSermonMessages);
  const coursesFn = useServerFn(listCourses);
  const preacherStatsFn = useServerFn(getPreacherCourseStats);

  const profile = useQuery({
    queryKey: ["account-profile", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles")
        .select("display_name, avatar_url").eq("id", userId!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const favorites = useQuery({
    queryKey: ["profile-favorites", userId], enabled: Boolean(userId),
    queryFn: () => favoritesFn(), retry: false,
  });
  const progress = useQuery({
    queryKey: ["profile-course-progress", userId], enabled: Boolean(userId),
    queryFn: () => progressFn(), retry: false,
  });
  const messages = useQuery({
    queryKey: ["profile-sermon-messages", userId], enabled: Boolean(userId),
    queryFn: () => messagesFn(), retry: false,
  });
  const courses = useQuery({
    queryKey: ["profile-course-catalog"], enabled: Boolean(userId),
    queryFn: () => coursesFn(), retry: false,
  });
  const preacherCourse = courses.data?.find((course) =>
    /prega/i.test(`${course.title} ${course.slug}`));
  const preacherStats = useQuery({
    queryKey: ["profile-preacher-stats", userId, preacherCourse?.id],
    enabled: Boolean(userId && preacherCourse?.id),
    queryFn: () => preacherStatsFn({ data: { courseId: preacherCourse!.id } }),
    retry: false,
  });

  const userMeta = user?.user_metadata ?? {};
  const displayName = profile.data?.display_name ||
    String(userMeta["full_name"] ?? userMeta["name"] ?? user?.email?.split("@")[0] ?? "Aluno");
  const avatarUrl = profile.data?.avatar_url ||
    (typeof userMeta["avatar_url"] === "string" ? userMeta["avatar_url"] : "");
  const initials = displayName.trim().slice(0, 2).toLocaleUpperCase("pt-BR");
  const completedLessons = progress.data?.reduce((sum, row) => sum + (row.completed_lessons ?? 0), 0) ?? 0;
  const totalLessons = progress.data?.reduce((sum, row) => sum + (row.total_lessons ?? 0), 0) ?? 0;
  const percentage = totalLessons ? Math.min(100, Math.round(completedLessons / totalLessons * 100)) : 0;
  const chapters = preacherStats.data?.studiedChapters;
  const totalChapters = preacherStats.data?.totalChapters || 1189;
  const studiedBooks = preacherStats.data?.studiedBooks;
  const asCount = (query: { isLoading: boolean; isError: boolean }, value: number) =>
    query.isLoading ? "…" : query.isError ? "—" : String(value);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-3 pb-6 sm:space-y-4">
      <section className={panel}>
        <div className="relative h-36 overflow-hidden bg-[#244e76] sm:h-44">
          <img src="/images/prayer-sunrise.webp" alt="" className="size-full object-cover object-[55%_44%]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b2e54]/45 to-transparent" />
          <Cross className="absolute right-6 top-8 size-12 text-amber-400 drop-shadow-lg" aria-hidden="true" />
        </div>
        <div className="relative px-4 pb-4 pt-12 sm:px-6 sm:pt-14">
          <div className="absolute -top-14 left-4 rounded-full border-4 border-white bg-white shadow-md sm:left-6">
            <Avatar className="size-24 sm:size-28">
              <AvatarImage src={avatarUrl || undefined} alt="Foto do perfil" className="object-cover" />
              <AvatarFallback className="bg-blue-100 text-xl font-bold text-blue-800">
                {initials || <UserRound className="size-9" />}
              </AvatarFallback>
            </Avatar>
            <button type="button" onClick={() => setShowEditor((v) => !v)}
              aria-label="Alterar foto do perfil"
              className={`absolute -bottom-1 -right-1 flex size-9 items-center justify-center rounded-full border-2 border-white bg-[#0d468e] text-white shadow ${focus}`}>
              <Camera className="size-4" aria-hidden="true" />
            </button>
          </div>
          <h1 className="text-2xl font-bold text-[#10264e] dark:text-foreground sm:text-3xl">{displayName}</h1>
          <div className="mt-1 flex items-start justify-between gap-2">
            <p className="max-w-md text-sm leading-snug text-slate-600 dark:text-slate-300">
              Crescendo no conhecimento de Cristo e da Sua Palavra. <span className="whitespace-nowrap">(2 Pedro 3:18)</span>
            </p>
            <button type="button" onClick={() => setShowEditor((v) => !v)}
              aria-label="Editar nome e foto" className={`rounded-lg p-2 text-blue-700 hover:bg-blue-50 dark:text-blue-300 ${focus}`}>
              <Pencil className="size-5" aria-hidden="true" />
            </button>
          </div>
          <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            <span className="size-2.5 rounded-full bg-emerald-500" /> Conectado
          </p>
          {showEditor && (
            <div className="mt-4" id="profile-edit-form">
              <ProfileEditor />
            </div>
          )}
          <div className="mt-4 grid grid-cols-4 gap-2 rounded-2xl border border-slate-200 p-3 dark:border-slate-700">
            {[
              { label: "Estudos", value: asCount(progress, completedLessons), icon: BookOpen },
              { label: "Cursos", value: asCount(progress, progress.data?.length ?? 0), icon: GraduationCap },
              { label: "Progresso", value: progress.isLoading ? "…" : progress.isError ? "—" : `${percentage}%`, icon: ChartNoAxesColumnIncreasing },
              { label: "Favoritos", value: asCount(favorites, favorites.data?.length ?? 0), icon: Heart },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="min-w-0 text-center">
                <Icon className="mx-auto mb-1 size-6 text-[#0d65a9]" aria-hidden="true" />
                <p className="text-[11px] leading-tight text-slate-600 dark:text-slate-300">{label}</p>
                <p className="mt-1 text-lg font-bold tabular-nums text-[#0b1e45] dark:text-foreground">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Link to="/escola" className={`block p-4 sm:p-5 ${panel} ${focus}`}>
        <div className="flex items-start gap-3">
          <Crown className="size-9 shrink-0 text-[#d49a1f]" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block text-lg font-bold text-[#10254b] dark:text-foreground">Minha Jornada Bíblica</span>
            <span className="block text-xs text-slate-600 dark:text-slate-300">Acompanhe seu progresso de Gênesis ao Apocalipse</span>
          </span>
          <ChevronRight className="mt-2 size-5 shrink-0 text-slate-500" aria-hidden="true" />
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div className="h-full rounded-full bg-gradient-to-r from-sky-600 to-blue-700" style={{ width: `${chapters == null ? 0 : Math.min(100, chapters / totalChapters * 100)}%` }} />
        </div>
        <p className="mt-2 flex flex-wrap items-center justify-between gap-1 text-xs text-[#193354] dark:text-slate-300">
          <span>Livros: {preacherStats.isLoading ? "…" : preacherStats.isError ? "—" : (studiedBooks ?? 0)}/66</span>
          <span>Capítulos: {preacherStats.isLoading ? "…" : preacherStats.isError ? "—" : (chapters ?? 0)}/{totalChapters}</span>
          <span>Mensagens: {asCount(messages, messages.data?.length ?? 0)}</span>
        </p>
      </Link>

      <section className={panel} aria-label="Menu do perfil">
        <button type="button" onClick={onOpenSettings}
          className={`flex min-h-16 w-full items-center gap-3 rounded-t-2xl bg-blue-50 px-4 text-left hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 ${focus}`}>
          <UserRound className="size-6 shrink-0 text-[#0868aa]" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold">Minha Conta</span>
            <span className="block text-xs text-slate-600 dark:text-slate-300">Dados, e-mail e segurança</span>
          </span>
          <ChevronRight className="size-5 shrink-0" aria-hidden="true" />
        </button>
        <ProfileLink to="/estudos" icon={ChartNoAxesColumnIncreasing} title="Meus Estudos e Progresso" description="Histórico, estudos e resultados" />
        <ProfileLink to="/diario" icon={NotebookPen} title="Minhas Anotações" description="Notas, percepções e reflexões" />
        <ProfileLink to="/favoritos" icon={Heart} title="Meus Favoritos" description="Estudos, devocionais e mensagens" />
        <ProfileLink to="/minhas-mensagens" icon={Mic2} title="Minhas Pregações" description="Esboços, mensagens e rascunhos" />
        <ProfileLink to="/comunidade" icon={UsersRound} title="Comunidade" description="Amigos, conversas e comunidade global" />
      </section>
      <button type="button" onClick={onOpenSettings}
        className={`flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white p-3 text-sm font-semibold text-blue-800 hover:bg-blue-50 dark:bg-card dark:text-blue-300 ${focus}`}>
        <Settings2 className="size-5" aria-hidden="true" /> Abrir Configurações
      </button>
    </div>
  );
}
