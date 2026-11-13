import { Link, useNavigate } from "@tanstack/react-router";
import {
  BookOpen, Compass, Flame, GraduationCap, HeartHandshake, Home, LogOut,
  MessageCircleHeart, Moon, NotebookPen, FilePenLine, Route as RouteIcon,
  Search, Settings, ShieldCheck, Star, Sun, Target, UsersRound, MoreVertical, UserRound,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSettings } from "@/lib/settings.functions";
import { useReminders } from "@/hooks/use-reminders";
import { useAuth, useTheme } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GlobalBackgroundMusic } from "@/components/GlobalBackgroundMusic";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import logo from "@/assets/logo.png";

const PRIMARY_NAV = [
  { to: "/inicio", label: "Início", icon: Home },
  { to: "/estudos", label: "Estudo", icon: BookOpen },
  { to: "/trilhas", label: "Trilhas", icon: RouteIcon },
  { to: "/escola", label: "Escola Bíblica", icon: GraduationCap },
] as const;

const MORE_NAV = [
  { to: "/assistente", label: "Assistente", icon: MessageCircleHeart },
  { to: "/devocional", label: "Devocional", icon: Flame },
  { to: "/planos", label: "Planos de oração", icon: HeartHandshake },
  { to: "/estudos", label: "Estudos", icon: Compass },
  { to: "/comunidade", label: "Comunidade", icon: UsersRound },
  { to: "/biblia", label: "Bíblia", icon: BookOpen },
  { to: "/pesquisa", label: "Pesquisa", icon: Search },
  { to: "/diario", label: "Diário", icon: NotebookPen },
  { to: "/minhas-mensagens", label: "Mensagens", icon: FilePenLine },
  { to: "/metas", label: "Metas", icon: Target },
  { to: "/favoritos", label: "Favoritos", icon: Star },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

const ALL_NAV = [...PRIMARY_NAV, ...MORE_NAV, { to: "/admin" as const, label: "Painel administrativo", icon: ShieldCheck }];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Navegação principal" className="flex flex-col gap-1">
      {ALL_NAV.map((item) => (
        <Link key={item.to} to={item.to} onClick={onNavigate}
          className="group flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground dark:text-slate-200/90 dark:hover:bg-blue-950/80 dark:hover:text-white"
          activeProps={{ className: "group flex min-h-11 items-center gap-3 rounded-xl bg-sidebar-accent px-3.5 py-2.5 text-sm font-semibold text-sidebar-accent-foreground dark:bg-blue-900/70 dark:text-white" }}>
          <item.icon className="size-5 shrink-0 text-sidebar-foreground/70 dark:text-blue-200" aria-hidden />{item.label}
        </Link>
      ))}
    </nav>
  );
}

export function AppShell({ children, title, subtitle, homeHeader = false }: { children: ReactNode; title: string; subtitle?: string; homeHeader?: boolean }) {
  const { theme, toggle } = useTheme();
  const { user } = useAuth();
  const metadata = user?.user_metadata ?? {};
  const displayName = String(metadata["full_name"] ?? metadata["name"] ?? user?.email?.split("@")[0] ?? "Usuário").trim().split(/\s+/)[0] || "Usuário";
  const avatarUrl = typeof metadata["avatar_url"] === "string" ? metadata["avatar_url"] : typeof metadata["picture"] === "string" ? metadata["picture"] : "";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const fetchSettings = useServerFn(getSettings);
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: () => fetchSettings() });
  useReminders(settings);

  async function signOut() {
    await queryClient.cancelQueries();
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) {
      toast.error("Não foi possível encerrar sua sessão. Tente novamente.");
      return;
    }
    queryClient.clear();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="app-ambient flex min-h-screen min-w-0 bg-sky-50/70 dark:bg-background">
      <GlobalBackgroundMusic />
      <aside className="hidden w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-4 py-6 dark:border-slate-800 dark:bg-[#08182c] lg:sticky lg:top-0 lg:flex lg:h-screen">
        <Link to="/inicio" className="mb-7 flex items-center gap-3 rounded-xl px-2 py-1">
          <img src={logo} alt="" width={42} height={42} className="size-10 shrink-0 object-contain" />
          <span className="font-display text-base font-semibold tracking-tight">Caminho Divino</span>
        </Link>
        <div className="min-h-0 flex-1 overflow-y-auto"><NavLinks /></div>
        <div className="mt-4 flex flex-col gap-1 border-t border-sidebar-border pt-3 dark:border-slate-800">
          <Button variant="ghost" size="sm" onClick={toggle} aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"} className="h-12 justify-between rounded-xl bg-blue-50 px-3.5 text-left dark:bg-blue-950/70 dark:text-blue-100 dark:hover:bg-blue-900/80">
            <span className="flex items-center gap-3"><Moon className="size-5 text-blue-700 dark:text-blue-300" />{theme === "dark" ? "Modo claro" : "Modo escuro"}</span>
            <span aria-hidden="true" className={`flex h-6 w-11 items-center rounded-full p-0.5 transition-colors ${theme === "dark" ? "bg-blue-500" : "bg-slate-300"}`}><span className={`size-5 rounded-full bg-white shadow transition-transform ${theme === "dark" ? "translate-x-5" : "translate-x-0"}`} /></span>
          </Button>
          <Button variant="ghost" size="sm" onClick={signOut} className="h-11 justify-start gap-3 rounded-xl px-3.5 text-sidebar-foreground/85 hover:bg-red-50 hover:text-red-700 dark:text-slate-200 dark:hover:bg-red-950/40 dark:hover:text-red-200"><LogOut className="size-5" /> Sair</Button>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-border/60 bg-white/90 backdrop-blur dark:bg-background/90">
          <div className="mx-auto flex min-h-16 w-full max-w-screen-2xl items-center gap-3 px-3 py-2 sm:px-5 lg:px-8">
            <div className="lg:hidden">
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full" aria-label="Abrir menu">
                    <MoreVertical className="size-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex w-[min(21rem,88vw)] flex-col overflow-y-auto border-sidebar-border bg-sidebar px-4 py-6 dark:border-slate-800 dark:bg-[#08182c]">
                  <Link to="/inicio" onClick={() => setOpen(false)} className="mb-7 flex items-center gap-3 px-2 py-1">
                    <img src={logo} alt="" width={36} height={36} className="size-9" />
                    <span className="font-display font-semibold">Caminho Divino</span>
                  </Link>
                  <div className="min-h-0 flex-1"><NavLinks onNavigate={() => setOpen(false)} /></div>
                  <div className="mt-6 flex flex-col gap-1 border-t border-sidebar-border pt-4 dark:border-slate-800">
                    <Button variant="ghost" size="sm" onClick={toggle} aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"} className="h-12 justify-between rounded-xl bg-blue-50 px-3.5 dark:bg-blue-950/70 dark:text-blue-100 dark:hover:bg-blue-900/80">
                      <span className="flex items-center gap-3"><Moon className="size-5 text-blue-700 dark:text-blue-300" />{theme === "dark" ? "Modo claro" : "Modo escuro"}</span>
                      <span aria-hidden="true" className={`flex h-6 w-11 items-center rounded-full p-0.5 transition-colors ${theme === "dark" ? "bg-blue-500" : "bg-slate-300"}`}><span className={`size-5 rounded-full bg-white shadow transition-transform ${theme === "dark" ? "translate-x-5" : "translate-x-0"}`} /></span>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={signOut} className="h-11 justify-start gap-3 rounded-xl px-3.5 text-sidebar-foreground/85 hover:bg-red-50 hover:text-red-700 dark:text-slate-200 dark:hover:bg-red-950/40 dark:hover:text-red-200"><LogOut className="size-5" /> Sair</Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            {homeHeader ? (
              <div className="flex min-w-0 flex-1 items-center justify-center gap-2 lg:justify-start">
                <img src={logo} alt="" width={34} height={34} className="size-9 shrink-0 object-contain" />
                <div className="min-w-0 text-center lg:text-left">
                  <p className="truncate font-display text-base font-bold tracking-tight text-[#142d59] dark:text-foreground">Caminho Divino</p>
                  <p className="truncate text-[10px] text-slate-500 dark:text-muted-foreground">A Palavra sempre com você</p>
                </div>
              </div>
            ) : (
              <div className="min-w-0 flex-1 text-right lg:text-left">
                <p className="truncate text-sm font-semibold">{title || "Caminho Divino"}</p>
                {subtitle ? <p className="truncate text-xs text-muted-foreground">{subtitle}</p> : null}
              </div>
            )}
            {homeHeader ? (
              <Link to="/configuracoes" aria-label="Abrir perfil" className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-blue-200 bg-blue-700 text-sm font-semibold text-white shadow-sm">
                {avatarUrl ? <img src={avatarUrl} alt="" className="size-full object-cover" /> : displayName.slice(0, 1).toLocaleUpperCase("pt-BR")}
              </Link>
            ) : (
              <Button variant="ghost" size="icon-sm" onClick={toggle} className="hidden lg:inline-flex" aria-label="Alternar tema">
                {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </Button>
            )}
          </div>
        </header>

        <main className="mx-auto w-full max-w-screen-2xl min-w-0 flex-1 px-3 pt-4 pb-24 sm:px-5 sm:pt-5 lg:px-8 lg:pb-10">{children}</main>

        <nav aria-label="Navegação rápida" className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-white/95 backdrop-blur dark:bg-background/95 lg:hidden">
          <div className={homeHeader ? "mx-auto grid max-w-lg grid-cols-4" : "mx-auto grid max-w-lg grid-cols-5"}>
            {(homeHeader ? [
              { to: "/inicio" as const, label: "Início", icon: Home },
              { to: "/estudos" as const, label: "Estudo", icon: BookOpen },
              { to: "/trilhas" as const, label: "Trilhas", icon: RouteIcon },
              { to: "/configuracoes" as const, label: "Perfil", icon: UserRound },
            ] : [...PRIMARY_NAV, { to: "/admin" as const, label: "Admin", icon: ShieldCheck }]).map((item) => (
              <Link key={item.to} to={item.to} className="flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] text-muted-foreground"
                activeProps={{ className: "flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-semibold text-primary" }}>
                <item.icon className="size-[18px]" aria-hidden />{item.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
