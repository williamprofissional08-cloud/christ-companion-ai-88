import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { friendlyAuthError } from "@/lib/auth-redirect";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Redefinir senha — Caminhando com Cristo" },
      { name: "description", content: "Defina uma nova senha para acessar sua conta." },
      { property: "og:title", content: "Redefinir senha — Caminhando com Cristo" },
      {
        property: "og:description",
        content: "Defina uma nova senha para acessar sua conta.",
      },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Senha atualizada com sucesso!");
      navigate({ to: "/inicio", replace: true });
    } catch (error) {
      toast.error(friendlyAuthError(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-heaven px-4">
      <Card className="w-full max-w-md p-7 shadow-soft">
        <h1 className="font-display text-2xl font-semibold">Nova senha</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Escolha uma senha com pelo menos 6 caracteres.
        </p>
        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="new-password">Senha</Label>
            <Input
              id="new-password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" variant="hero" size="lg" disabled={loading}>
            {loading ? "Salvando..." : "Salvar nova senha"}
          </Button>
        </form>
        <Link
          to="/auth"
          className="mt-5 block text-center text-xs text-muted-foreground hover:underline"
        >
          Voltar para o login
        </Link>
      </Card>
    </main>
  );
}
