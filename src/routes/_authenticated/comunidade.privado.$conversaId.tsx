import { createFileRoute } from "@tanstack/react-router";
import { PrivateConversationView } from "@/components/community/PrivateMessages";

export const Route = createFileRoute("/_authenticated/comunidade/privado/$conversaId")({
  head: () => ({ meta: [{ title: "Conversa privada — Caminho Divino" }] }),
  component: ConversationRoute,
});

function ConversationRoute() {
  const { conversaId } = Route.useParams();
  return <PrivateConversationView conversaId={conversaId} />;
}
