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
  // Query the caller's own role through RLS instead of exposing a SECURITY DEFINER
  // role-probing RPC to every authenticated client.
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  // Falha de infraestrutura/autenticação não pode ser confundida com ausência de papel.
  if (error) {
    throw new Error(`Não foi possível verificar a permissão administrativa: ${error.message}`);
  }

  return data?.role === "admin";
}

export async function assertAdmin(supabase: SupabaseClient<Database>, userId: string) {
  if (!(await isAdminUser(supabase, userId))) {
    throw new Error("Acesso restrito a administradores.");
  }
}
