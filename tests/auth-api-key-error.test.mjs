import assert from "node:assert/strict";
import test from "node:test";
import { AUTH_API_KEY_CONFIGURATION_MESSAGE, friendlyAuthError, isAuthApiKeyError } from "../src/lib/auth-redirect.ts";

const credentialsMessage = "Não foi possível entrar com esses dados. Confira o e-mail e a senha. Se você acabou de criar a conta, confirme primeiro o endereço pelo link enviado por e-mail; depois volte para entrar. Se não recebeu a mensagem, use a opção de reenviar confirmação.";

test("invalid Supabase API keys show a configuration message, regardless of case", () => {
  for (const message of ["Invalid API key", "INVALID_API_KEY", "No API key found in request", "apikey is invalid", "missing apikey"]) {
    assert.equal(friendlyAuthError(new Error(message)), AUTH_API_KEY_CONFIGURATION_MESSAGE);
    assert.equal(isAuthApiKeyError(new Error(message)), true);
  }
  assert.equal(friendlyAuthError({ code: "invalid_api_key" }), AUTH_API_KEY_CONFIGURATION_MESSAGE);
});

test("invalid login credentials keeps the existing credentials message", () => {
  assert.equal(friendlyAuthError(new Error("Invalid login credentials")), credentialsMessage);
  assert.equal(isAuthApiKeyError(new Error("Invalid login credentials")), false);
});

test("unconfirmed email and network failures retain existing messages", () => {
  assert.equal(friendlyAuthError(new Error("Email not confirmed")), "Seu e-mail ainda não foi confirmado. Abra o link enviado para sua caixa de entrada ou spam e tente entrar novamente.");
  assert.equal(friendlyAuthError(new Error("Failed to fetch")), "Não foi possível conectar ao serviço de cadastro. Verifique sua internet e tente novamente.");
});
