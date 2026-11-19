import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const authRoute = readFileSync("src/routes/_authenticated/route.tsx", "utf8");
const rootRoute = readFileSync("src/routes/__root.tsx", "utf8");
const serverAuth = readFileSync("src/integrations/supabase/auth-middleware.ts", "utf8");
const appShell = readFileSync("src/components/AppShell.tsx", "utf8");

test("navegação protegida usa sessão local sem getUser remoto a cada clique", () => {
  assert.match(authRoute, /beforeLoad:\s*async\s*\(\{\s*location\s*\}\)\s*=>\s*\{/);
  assert.match(authRoute, /await supabase\.auth\.getSession\(\)/);
  assert.doesNotMatch(authRoute, /await supabase\.auth\.getUser\(\)/);
  assert.match(authRoute, /redirect\(\{ to: "\/auth"/);
});

test("segurança das funções de servidor continua validando JWT com getUser", () => {
  assert.match(serverAuth, /supabase\.auth\.getUser\(token\)/);
  assert.match(serverAuth, /issuer !==/);
});

test("confirmação da mesma sessão não invalida todas as rotas", () => {
  assert.match(rootRoute, /event === "INITIAL_SESSION"/);
  assert.match(rootRoute, /if \(userId === lastUserId\) return/);
  assert.match(rootRoute, /event === "SIGNED_OUT"/);
  assert.match(rootRoute, /router\.invalidate\(\)/);
});

test("navegação compartilhada mantém links internos para áreas essenciais", () => {
  for (const path of ["/inicio", "/estudos", "/trilhas", "/devocional", "/escola"]) {
    assert.ok(appShell.includes(`to: "${path}"`), `Link interno ausente: ${path}`);
  }
});
