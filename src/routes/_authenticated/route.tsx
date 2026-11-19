import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { GlobalBackgroundMusic } from "@/components/GlobalBackgroundMusic";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    // Antes, getUser() fazia uma chamada remota em TODA troca de aba, bloqueando
    // a transição de rotas enquanto a rede/autenticação respondia.
    // Esta checagem é apenas de navegação. Todas as server functions mantêm
    // validação real do JWT pelo Supabase no requireSupabaseAuth.
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.user) {
      throw redirect({ to: "/auth", search: { redirect: location.href } });
    }
    return { user: data.session.user };
  },
  component: () => (
    <GlobalBackgroundMusic>
      <Outlet />
    </GlobalBackgroundMusic>
  ),
});

