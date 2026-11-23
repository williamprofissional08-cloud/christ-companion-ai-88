/**
 * Complete email confirmation and OAuth callbacks without creating, deleting or
 * editing accounts. The browser Supabase client may have already processed the
 * implicit fragment / PKCE code while initializing, so check its session first.
 * All credentials stay in-memory and are never logged or added to messages.
 */
type AuthResult<T> = { data: T; error: unknown };
type SessionResult = AuthResult<{ session: unknown | null }>;
type UserResult = AuthResult<{ user: unknown | null }>;
type ActionResult = { error: unknown };

type EmailVerificationType = "signup" | "email" | "magiclink" | "recovery" | "invite";

export type CallbackAuthClient = {
  getSession: () => Promise<SessionResult>;
  getUser: () => Promise<UserResult>;
  exchangeCodeForSession: (code: string) => Promise<ActionResult>;
  verifyOtp: (params: { token_hash: string; type: EmailVerificationType }) => Promise<ActionResult>;
  setSession: (tokens: { access_token: string; refresh_token: string }) => Promise<ActionResult>;
};

export type CallbackOutcome = "authenticated" | "sign_in_required" | "email_verified";

function throwIfError(error: unknown): void {
  if (error) throw error;
}

/**
 * The default Supabase email template redirects with an implicit URL fragment;
 * customized templates may return ?token_hash=...&type=signup, while PKCE uses
 * ?code=... . Do not expose any of these values in the UI or error logs.
 */
export async function finishAuthCallback(
  auth: CallbackAuthClient,
  search: string,
  fragment: string,
): Promise<CallbackOutcome> {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const hash = new URLSearchParams(fragment.startsWith("#") ? fragment.slice(1) : fragment);

  const linkError = params.get("error_code") ?? hash.get("error_code")
    ?? params.get("error_description") ?? hash.get("error_description")
    ?? params.get("error") ?? hash.get("error");
  if (linkError) throw new Error(linkError);

  const tokenHash = params.get("token_hash") ?? hash.get("token_hash");
  let emailVerified = false;
  if (tokenHash) {
    const requestedType = params.get("type") ?? hash.get("type");
    const validTypes: EmailVerificationType[] = ["signup", "email", "magiclink", "recovery", "invite"];
    if (!requestedType || !validTypes.some((type) => type === requestedType)) {
      throw new Error("Tipo de confirmação por e-mail inválido.");
    }
    const { error } = await auth.verifyOtp({
      token_hash: tokenHash,
      type: requestedType as EmailVerificationType,
    });
    throwIfError(error);
    emailVerified = requestedType === "signup" || requestedType === "email";
  }

  const { data: existing, error: sessionError } = await auth.getSession();
  let hasSession = Boolean(existing?.session);
  const code = params.get("code");
  if (!hasSession && code) {
    const { error } = await auth.exchangeCodeForSession(code);
    throwIfError(error);
    hasSession = true;
  }

  // Browser clients normally consume the fragment on their own. Handle it
  // explicitly only when initialization left no session (e.g. email webviews).
  const accessToken = hash.get("access_token");
  const refreshToken = hash.get("refresh_token");
  if (!hasSession && accessToken && refreshToken) {
    const { error } = await auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    throwIfError(error);
    hasSession = true;
  }

  if (!hasSession) {
    // A missing session does not mean the user's account is absent.
    if (sessionError && !code && !tokenHash && !accessToken) throw sessionError;
    return emailVerified ? "email_verified" : "sign_in_required";
  }

  // Do not trust a locally stored token until the correct Supabase project
  // verifies it. A preview JWT from a previous project must never pass.
  const { data, error } = await auth.getUser();
  throwIfError(error);
  return data?.user ? "authenticated" : "sign_in_required";
}
