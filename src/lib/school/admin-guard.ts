import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/**
 * Verificação de administrador feita no servidor, via função segura do banco.
 * Nunca confie apenas no frontend.
 */
export async function isAdminUser(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error) return false;
  return Boolean(data);
}

export async function assertAdmin(supabase: SupabaseClient<Database>, userId: string) {
  if (!(await isAdminUser(supabase, userId))) {
    throw new Error("Acesso restrito a administradores.");
  }
}
