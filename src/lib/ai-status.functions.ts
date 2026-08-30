import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdmin } from "./school/admin-guard";
import { checkAiGatewayStatus } from "./ai-status.server";

/** Diagnóstico do provedor de IA (Assistente e Professor IA). Só administradores. */
export const getAiStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    return checkAiGatewayStatus();
  });
