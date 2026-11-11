import { Link, useNavigate } from "@tanstack/react-router";
import {
  BookOpen,
  Compass,
  Flame,
  GraduationCap,

  HeartHandshake,
  Home,
  LogOut,
  Menu,
  MessageCircleHeart,
  Moon,
  NotebookPen,
  FilePenLine,
  Route as RouteIcon,
  Search,
  Settings,
  ShieldCheck,
  Star,
  Sun,
  Target,
  UsersRound,
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

const NAV = [
  { to: "/inicio", label: "Início", icon: Home },
  { to: "/devocional", label: "Devocional", icon: Flame },
  { to: "/assistente", label: "Assistente", icon: MessageCircleHeart },
  { to: "/trilhas", label: "Trilhas guiadas", icon: RouteIcon },
  { to: "/escola", label: "Escola Bíblica", icon: GraduationCap },
  { to: "/planos", label: "Planos de oração", icon: HeartHandshake },

  { to: "/estudos", label: "Estudos", icon: Compass },
  { to: "/comunidade", label: "Comunidade", icon: UsersRound },
  { to: "/biblia", label: "Bíblia", icon: BookOpen },
  { to: "/pesquisa", label: "Pesquisa", icon: Search },
  { to: "/diario", label: "Diário", icon: NotebookPen },
  { to: "/minhas-mensagens", label: "Minhas mensagens", icon: FilePenLine },
  { to: "/metas", label: "Metas", icon: Target },
  { to: "/favoritos", label: "Favoritos", icon: Star },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  // Keep the admin entry discoverable. The /admin route and every admin
  // server function enforce the role on the server; hiding this link here
  // made a transient permission-query failure look like a deleted panel.
  const items = [...NAV, { to: "/admin" as const, label: "Painel administrativo", icon: ShieldCheck }];

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => (
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
    <div className="app-ambient min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-72 flex-col border-r border-sidebar-border bg-sidebar px-4 py-6 lg:flex">
        <Link to="/inicio" className="mb-8 flex items-center gap-3 px-2">
          <img src={logo} alt="" width={40} height={40} className="size-10" />
          <span className="font-display text-lg leading-tight font-semibold text-sidebar-foreground">
            Caminho
            <br />
            Divino
          </span>
        </Link>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin]"><NavLinks /></div>
        <div className="mt-4 flex shrink-0 flex-col gap-2 border-t border-sidebar-border pt-4">
          <Button variant="ghost" size="sm" onClick={toggle} className="justify-start gap-3">
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            {theme === "dark" ? "Modo claro" : "Modo escuro"}
          </Button>
          <Button variant="ghost" size="sm" onClick={signOut} className="justify-start gap-3">
            <LogOut className="size-4" /> Sair
          </Button>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
          <div className="mx-auto flex w-full max-w-[1600px] items-center gap-3 px-4 py-3.5 sm:px-6 lg:px-8 2xl:px-10">
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
                  <span className="font-display font-semibold">Caminho Divino</span>
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
        <main className="mx-auto w-full max-w-[1600px] px-4 pt-6 pb-24 sm:px-6 lg:px-8 lg:pt-8 lg:pb-12 2xl:px-10">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/95 backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {[NAV[0], NAV[2], NAV[3], NAV[4], { to: "/admin" as const, label: "Admin", icon: ShieldCheck }].map((item) => (
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
