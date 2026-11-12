export const MESSAGE_LIMIT = 500;
export function messageText(value: string) {
  return value.replace(/<[^>]*>/g, "").trim();
}
export function validMessage(value: string) {
  const length = Array.from(messageText(value)).length;
  return length > 0 && length <= MESSAGE_LIMIT;
}
export function participantPair(a: string, b: string) {
  if (!a || !b || a === b) throw new Error("Escolha outro membro.");
  return a < b ? { user_a: a, user_b: b } : { user_a: b, user_b: a };
}
export type Member = { id: string; display_name: string | null; avatar_url: string | null };
export type ChatMessage = { id: string; conteudo: string; criado_em: string; user_id?: string; remetente_id?: string; conversa_id?: string; lida?: boolean; apagada?: boolean };
export function authorId(message: ChatMessage) { return message.user_id ?? message.remetente_id ?? ""; }