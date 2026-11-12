import { createFileRoute } from "@tanstack/react-router";
import { PrivateMessagesList } from "@/components/community/PrivateMessages";

export const Route = createFileRoute("/_authenticated/comunidade/privado/")({
  head: () => ({ meta: [{ title: "Mensagens privadas — Caminho Divino" }] }),
  component: PrivateMessagesList,
});
