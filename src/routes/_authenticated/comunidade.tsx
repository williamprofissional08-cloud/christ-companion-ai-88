import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, MessageCircle, ShieldCheck, UsersRound } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const WHATSAPP_GROUP_INVITE =
  "https://chat.whatsapp.com/KXe3BvJqUyJ2sX5NAShfPi?s=cl&p=i&mlu=4&ilr=4&iam=2";

export const Route = createFileRoute("/_authenticated/comunidade")({
  head: () => ({
    meta: [
      { title: "Comunidade — Caminho Divino" },
      {
        name: "description",
        content: "Encontre o grupo de comunidade do Caminho Divino no WhatsApp.",
      },
    ],
  }),
  component: ComunidadePage,
});

function ComunidadePage() {
  return (
    <AppShell
      title="Comunidade"
      subtitle="Caminhe e compartilhe aprendizados com outras pessoas."
    >
      <div className="mx-auto max-w-2xl space-y-5">
        <Card className="border-border/60 p-6 shadow-soft sm:p-8">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <UsersRound className="size-7" aria-hidden />
          </div>

          <h2 className="mt-5 font-display text-2xl font-semibold">
            Faça parte da comunidade
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Se desejar, participe do grupo do Caminho Divino no WhatsApp para
            compartilhar experiências, conversar e caminhar junto com outras
            pessoas que também buscam aprender mais da Palavra.
          </p>

          <Button asChild variant="hero" className="mt-6 w-full sm:w-auto">
            <a
              href={WHATSAPP_GROUP_INVITE}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Abrir convite do grupo do Caminho Divino no WhatsApp em nova aba"
            >
              <MessageCircle className="mr-2 size-4" aria-hidden />
              Entrar no grupo do WhatsApp
              <ExternalLink className="ml-2 size-4" aria-hidden />
            </a>
          </Button>

          <div className="mt-6 flex items-start gap-3 rounded-xl bg-muted/60 p-4">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
            <p className="text-xs leading-relaxed text-muted-foreground">
              A entrada é opcional e acontece diretamente no WhatsApp. Antes de
              participar, confira o nome e as informações do grupo. Respeite a
              privacidade dos participantes e as orientações dos administradores.
            </p>
          </div>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          O Caminho Divino não precisa acessar sua conta do WhatsApp nem armazenar
          seus dados para oferecer esse convite.
        </p>
      </div>
    </AppShell>
  );
}
