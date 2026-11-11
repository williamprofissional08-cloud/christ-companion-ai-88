import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/**
 * Resolve o papel usando o cliente privilegiado apenas no servidor.
 * A identidade do usuário já foi autenticada pelo requireSupabaseAuth antes
 * de chegar a qualquer função administrativa. A consulta fica restrita ao
 * userId verificado recebido do contexto; nenhuma chave privilegiada chega
 * ao navegador.
 */
export async function isAdminUser(
  _supabase: SupabaseClient<Database>,
  userId: string,
): Promise<boolean> {
  // Query the role through the already-authenticated client. This guarantees
  // the lookup uses the exact Supabase project that issued the user's session.
  // RLS explicitly permits each authenticated user to read their own role.
  const { data, error } = await _supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (error) {
    console.error("[Admin authorization] Role lookup failed:", error.message);
    throw new Error("Não foi possível consultar sua permissão administrativa. Tente novamente.");
  }

  return data?.role === "admin";
}

export async function assertAdmin(supabase: SupabaseClient<Database>, userId: string) {
  if (!(await isAdminUser(supabase, userId))) {
    throw new Error("Acesso restrito a administradores.");
  }
}
