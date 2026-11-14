/**
 * Check a persisted login without altering the user's stored session.
 *
 * A timeout, network error, or temporarily unavailable Auth service does NOT
 * prove the account is missing and must never trigger a local sign-out.
 */
export type ExistingSessionStatus = "authenticated" | "signed-out" | "unavailable";

/** No persisted token is normal for first-time visitors, not a service outage. */
function isMissingSession(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const value = error as { name?: unknown; code?: unknown; message?: unknown };
  return (
    value.name === "AuthSessionMissingError" ||
    value.code === "session_not_found" ||
    (typeof value.message === "string" && /^auth session missing!?$/i.test(value.message.trim()))
  );
}

type UserLookup = () => Promise<{
  data: { user: unknown | null } | null;
  error: unknown;
}>;

export async function checkExistingAccountSession(
  getUser: UserLookup,
  timeoutMs = 8_000,
): Promise<ExistingSessionStatus> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const response = await Promise.race([
      Promise.resolve().then(getUser),
      new Promise<never>((_resolve, reject) => {
        timeout = setTimeout(() => reject(new Error("Auth session check timed out")), timeoutMs);
      }),
    ]);
    if (response.error) return isMissingSession(response.error) ? "signed-out" : "unavailable";
    return response.data?.user ? "authenticated" : "signed-out";
  } catch (error) {
    return isMissingSession(error) ? "signed-out" : "unavailable";
  } finally {
    if (timeout !== undefined) clearTimeout(timeout);
  }
}
