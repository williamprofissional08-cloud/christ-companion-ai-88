import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { CommunityChat } from "@/components/community/CommunityChat";
export const Route = createFileRoute("/_authenticated/comunidade_/privado/$conversaId")({
  head: () => ({ meta: [{ title: "Conversa privada — Caminho Divino" }, { name: "description", content: "Conversa particular entre membros do Caminho Divino." }, { property: "og:title", content: "Conversa privada — Caminho Divino" }, { property: "og:description", content: "Conversa protegida da comunidade." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: PrivateConversation,
});
function PrivateConversation() {
  const { conversaId } = Route.useParams();
  return <AppShell title="Comunidade" subtitle="Conversa privada"><CommunityChat conversationId={conversaId} /></AppShell>;
}