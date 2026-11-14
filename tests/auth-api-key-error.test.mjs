import assert from "node:assert/strict";
import test from "node:test";
import { AUTH_API_KEY_CONFIGURATION_MESSAGE, friendlyAuthError, isAuthApiKeyError } from "../src/lib/auth-redirect.ts";

const credentialsMessage = "Não foi possível entrar com esses dados. Confira o e-mail e a senha ou use “Esqueceu sua senha?” para recuperar o acesso. Se acabou de criar a conta, confira a confirmação por e-mail. Esse erro não significa que sua conta foi apagada.";

test("invalid Supabase API keys show a configuration message, regardless of case", () => {
  for (const message of ["Invalid API key", "INVALID_API_KEY", "No API key found in request", "apikey is invalid", "apikey is not valid", "  INVALID   API KEY  ", "missing apikey"]) {
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
  assert.equal(isAuthApiKeyError(new Error("Failed to fetch")), false);
  assert.equal(friendlyAuthError(new Error("Failed to fetch")), "Não foi possível conectar ao serviço de cadastro. Verifique sua internet e tente novamente.");
});

test("structured auth email codes get clear recovery instructions instead of object errors", () => {
  assert.match(friendlyAuthError({ code: "email_exists" }), /recuperar o acesso/);
  assert.match(friendlyAuthError({ code: "user_already_exists" }), /recuperar o acesso/);
  assert.match(friendlyAuthError({ code: "email_not_confirmed" }), /ainda não foi confirmado/);
  assert.match(friendlyAuthError({ code: "email_address_not_authorized" }), /serviço de e-mail/);
  assert.match(friendlyAuthError({ code: "over_email_send_rate_limit" }), /Muitas tentativas/);
  assert.match(friendlyAuthError({ code: "otp_expired" }), /expirou/);
  assert.match(friendlyAuthError({ code: "session_not_found" }), /sessão não está ativa/);
  assert.equal(friendlyAuthError({ code: "unexpected" }), "Não foi possível concluir o cadastro. Tente novamente.");
});
