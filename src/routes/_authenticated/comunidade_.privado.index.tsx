import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { CommunityChat } from "@/components/community/CommunityChat";
export const Route = createFileRoute("/_authenticated/comunidade_/privado/")({
  head: () => ({ meta: [{ title: "Mensagens privadas — Caminho Divino" }, { name: "description", content: "Suas conversas privadas na comunidade Caminho Divino." }, { property: "og:title", content: "Mensagens privadas — Caminho Divino" }, { property: "og:description", content: "Conversas entre membros da comunidade." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <AppShell title="Comunidade" subtitle="Mensagens privadas"><CommunityChat inbox /></AppShell>,
});