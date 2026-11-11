import { Link, useNavigate } from "@tanstack/react-router";
import {
  BookOpen, Compass, Flame, GraduationCap, HeartHandshake, Home, LogOut,
  MessageCircleHeart, Moon, NotebookPen, FilePenLine, Route as RouteIcon,
  Search, Settings, ShieldCheck, Star, Sun, Target, UsersRound, MoreHorizontal,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSettings } from "@/lib/settings.functions";
import { useReminders } from "@/hooks/use-reminders";
import { useTheme } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import logo from "@/assets/logo.png";

const PRIMARY_NAV = [
  { to: "/inicio", label: "Início", icon: Home },
  { to: "/assistente", label: "Assistente", icon: MessageCircleHeart },
  { to: "/trilhas", label: "Trilhas guiadas", icon: RouteIcon },
  { to: "/escola", label: "Escola Bíblica", icon: GraduationCap },
] as const;

const MORE_NAV = [
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

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const items = [...MORE_NAV, { to: "/admin" as const, label: "Painel administrativo", icon: ShieldCheck }];
  return (
    <nav className="flex flex-col gap-0.5">
      {items.map((item) => (
        <Link key={item.to} to={item.to} onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          activeProps={{ className: "flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] font-semibold bg-sidebar-accent text-sidebar-accent-foreground" }}>
          <item.icon className="size-4.5 shrink-0" aria-hidden />{item.label}
        </Link>
      ))}
    </nav>
  );
}

export function AppShell({ children, title, subtitle }: { children: ReactNode; title: string; subtitle?: string }) {
  const { theme, toggle } = useTheme();
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
    <div className="app-ambient min-h-screen bg-sky-50/70 dark:bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-white/90 backdrop-blur dark:bg-background/90">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-3 py-3 sm:px-5">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 rounded-full" aria-label="Abrir menu Mais">
                <MoreHorizontal className="size-4" /> Mais
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 overflow-y-auto bg-sidebar px-4 py-6">
              <Link to="/inicio" onClick={() => setOpen(false)} className="mb-6 flex items-center gap-3 px-2">
                <img src={logo} alt="" width={36} height={36} className="size-9" />
                <span className="font-display font-semibold">Caminho Divino</span>
              </Link>
              <NavLinks onNavigate={() => setOpen(false)} />
              <div className="mt-6 flex flex-col gap-2 border-t border-sidebar-border pt-4">
                <Button variant="ghost" size="sm" onClick={toggle} className="justify-start gap-3">
                  {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                  {theme === "dark" ? "Modo claro" : "Modo escuro"}
                </Button>
                <Button variant="ghost" size="sm" onClick={signOut} className="justify-start gap-3"><LogOut className="size-4" /> Sair</Button>
              </div>
            </SheetContent>
          </Sheet>
          <div className="min-w-0 flex-1 text-right">
            <p className="truncate text-sm font-semibold">{title || "Caminho Divino"}</p>
            {subtitle ? <p className="truncate text-xs text-muted-foreground">{subtitle}</p> : null}
          </div>
          <Button variant="ghost" size="icon-sm" onClick={toggle} className="hidden sm:inline-flex" aria-label="Alternar tema">
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-3 pt-4 pb-24 sm:px-5 sm:pt-5">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-white/95 backdrop-blur dark:bg-background/95">
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {[...PRIMARY_NAV, { to: "/admin" as const, label: "Admin", icon: ShieldCheck }].map((item) => (
            <Link key={item.to} to={item.to} className="flex flex-col items-center gap-0.5 py-2 text-[10px] text-muted-foreground"
              activeProps={{ className: "flex flex-col items-center gap-0.5 py-2 text-[10px] text-primary font-semibold" }}>
              <item.icon className="size-[18px]" aria-hidden />{item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
