/**
 * Central contact identity for Caminho Divino.
 *
 * Keep public contact addresses here so UI and server workflows can share
 * one source of truth. Never use this address as an authorization mechanism.
 */
export const APP_CONTACT = Object.freeze({
  name: "Caminho Divino",
  email: "caminhando.com_cristo@outlook.com",
  mailto: "mailto:caminhando.com_cristo@outlook.com",
});

export const APP_EMAIL_SUBJECTS = Object.freeze({
  support: "[Caminho Divino] Suporte",
  moderation: "[Caminho Divino] Moderação de conteúdo",
  administration: "[Caminho Divino] Administração",
});
