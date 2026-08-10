import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Flame, HeartHandshake, MessageCircleHeart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import logo from "@/assets/logo.png";
import { useAuth } from "@/hooks/use-auth";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Caminhando com Cristo — companheiro espiritual diário" },
      {
        name: "description",
        content:
          "Devocional diário, planos de oração, estudos bíblicos e um assistente com IA fundamentado na Bíblia. Cresça em intimidade com Deus todos os dias.",
      },
      { property: "og:title", content: "Caminhando com Cristo" },
      {
        property: "og:description",
        content:
          "Devocional diário, planos de oração, estudos bíblicos e assistente com IA fundamentado nas Escrituras.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: Flame,
    title: "Devocional diário",
    text: "Versículo, reflexão, aplicação prática, oração e desafio gerados para o seu dia.",
  },
  {
    icon: MessageCircleHeart,
    title: "Assistente bíblico",
    text: "Tire dúvidas, entenda passagens, parábolas e profecias — sempre com as referências citadas.",
  },
  {
    icon: HeartHandshake,
    title: "Planos de oração",
    text: "Dezenas de planos com leitura, oração, desafio, checklist e anotações.",
  },
  {
    icon: BookOpen,
    title: "Bíblia e estudos",
    text: "Leia, pesquise, favorite e aprofunde-se em estudos por livro, personagem ou tema.",
  },
];

function Landing() {
  const { isAuthenticated, loading } = useAuth();
  const signedIn = !loading && isAuthenticated;
  const primaryTo = signedIn ? "/inicio" : "/auth";

  return (
    <main className="min-h-screen bg-heaven">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Caminhando com Cristo" width={44} height={44} className="size-11" />
          <span className="font-display text-lg font-semibold">Caminhando com Cristo</span>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to={primaryTo}>{signedIn ? "Ir para o app" : "Entrar"}</Link>
        </Button>
      </header>

      <section className="mx-auto max-w-3xl px-5 pt-10 pb-14 text-center">
        <p className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground">
          <Sparkles className="size-3.5" aria-hidden /> Fundamentado somente na Bíblia
        </p>
        <h1 className="mt-5 font-display text-4xl leading-tight font-semibold sm:text-5xl">
          Seu companheiro diário de comunhão com Cristo
        </h1>
        <p className="mt-4 text-base text-muted-foreground sm:text-lg">
          Crie uma rotina de oração, leitura e obediência à Palavra. Conteúdos personalizados com
          inteligência artificial, sempre citando as referências bíblicas.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild variant="hero" size="lg">
            <Link to={primaryTo}>{signedIn ? "Continuar minha jornada" : "Começar agora"}</Link>
          </Button>
          {signedIn ? null : (
            <Button asChild variant="outline" size="lg">
              <Link to="/auth">Já tenho conta</Link>
            </Button>
          )}
        </div>

        <blockquote className="mt-10 font-display text-lg text-foreground/80 italic">
          “Lâmpada para os meus pés é a tua palavra e luz para o meu caminho.”
          <footer className="mt-1 text-sm not-italic text-muted-foreground">Salmos 119:105</footer>
        </blockquote>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-5 pb-20 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <Card key={f.title} className="animate-rise border-border/50 p-6 shadow-soft">
            <f.icon className="size-6 text-primary" aria-hidden />
            <h2 className="mt-3 font-display text-xl font-semibold">{f.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
          </Card>
        ))}
      </section>
    </main>
  );
}
