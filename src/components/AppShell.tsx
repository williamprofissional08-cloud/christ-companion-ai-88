import { Link, useNavigate } from "@tanstack/react-router";
import {
  BookOpen,
  Compass,
  Flame,
  HeartHandshake,
  Home,
  LogOut,
  Menu,
  MessageCircleHeart,
  Moon,
  NotebookPen,
  Route as RouteIcon,
  Search,
  Settings,
  Star,
  Sun,
  Target,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSettings } from "@/lib/settings.functions";
import { useReminders } from "@/hooks/use-reminders";
import { useTheme } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import logo from "@/assets/logo.png";

const NAV = [
  { to: "/inicio", label: "Início", icon: Home },
  { to: "/devocional", label: "Devocional", icon: Flame },
  { to: "/assistente", label: "Assistente", icon: MessageCircleHeart },
  { to: "/trilhas", label: "Trilhas guiadas", icon: RouteIcon },
  { to: "/planos", label: "Planos de oração", icon: HeartHandshake },
  { to: "/estudos", label: "Estudos", icon: Compass },
  { to: "/biblia", label: "Bíblia", icon: BookOpen },
  { to: "/pesquisa", label: "Pesquisa", icon: Search },
  { to: "/diario", label: "Diário", icon: NotebookPen },
  { to: "/metas", label: "Metas", icon: Target },
  { to: "/favoritos", label: "Favoritos", icon: Star },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          activeProps={{
            className:
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold bg-sidebar-accent text-sidebar-accent-foreground",
          }}
        >
          <item.icon className="size-4.5 shrink-0" aria-hidden />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function AppShell({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
}) {
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const fetchSettings = useServerFn(getSettings);
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: () => fetchSettings() });
  useReminders(settings);

  useEffect(() => {
    if (!settings) return;
    const incomplete =
      !settings.onboarding_completed ||
      (settings.interests?.length ?? 0) === 0 ||
      !settings.daily_goal?.trim();
    if (incomplete) navigate({ to: "/onboarding", replace: true });
  }, [settings, navigate]);


  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar px-4 py-6 lg:flex">
        <Link to="/inicio" className="mb-8 flex items-center gap-3 px-2">
          <img src={logo} alt="" width={40} height={40} className="size-10" />
          <span className="font-display text-lg leading-tight font-semibold text-sidebar-foreground">
            Caminhando
            <br />
            com Cristo
          </span>
        </Link>
        <NavLinks />
        <div className="mt-auto flex flex-col gap-2 pt-6">
          <Button variant="ghost" size="sm" onClick={toggle} className="justify-start gap-3">
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            {theme === "dark" ? "Modo claro" : "Modo escuro"}
          </Button>
          <Button variant="ghost" size="sm" onClick={signOut} className="justify-start gap-3">
            <LogOut className="size-4" /> Sair
          </Button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3.5 sm:px-6">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="lg:hidden" aria-label="Abrir menu">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 bg-sidebar px-4 py-6">
                <Link
                  to="/inicio"
                  onClick={() => setOpen(false)}
                  className="mb-6 flex items-center gap-3 px-2"
                >
                  <img src={logo} alt="" width={36} height={36} className="size-9" />
                  <span className="font-display font-semibold">Caminhando com Cristo</span>
                </Link>
                <NavLinks onNavigate={() => setOpen(false)} />
                <div className="mt-6 flex flex-col gap-2">
                  <Button variant="ghost" size="sm" onClick={toggle} className="justify-start gap-3">
                    {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                    {theme === "dark" ? "Modo claro" : "Modo escuro"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={signOut} className="justify-start gap-3">
                    <LogOut className="size-4" /> Sair
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-semibold sm:text-lg">{title}</h1>
              {subtitle ? (
                <p className="truncate text-xs text-muted-foreground sm:text-sm">{subtitle}</p>
              ) : null}
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggle}
              className="hidden sm:inline-flex lg:hidden"
              aria-label="Alternar tema"
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 pt-5 pb-24 sm:px-6 lg:pb-12">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/95 backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5">
          {NAV.slice(0, 5).map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex flex-col items-center gap-1 py-2.5 text-[11px] text-muted-foreground"
              activeProps={{
                className: "flex flex-col items-center gap-1 py-2.5 text-[11px] text-primary font-semibold",
              }}
            >
              <item.icon className="size-5" aria-hidden />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
