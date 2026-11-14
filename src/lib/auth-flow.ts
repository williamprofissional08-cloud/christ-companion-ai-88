/**
 * Check a persisted login without altering the user's stored session.
 *
 * A timeout, network error, or temporarily unavailable Auth service does NOT
 * prove the account is missing and must never trigger a local sign-out.
 */
export type ExistingSessionStatus = "authenticated" | "signed-out" | "unavailable";

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
    if (response.error) return "unavailable";
    return response.data?.user ? "authenticated" : "signed-out";
  } catch {
    return "unavailable";
  } finally {
    if (timeout !== undefined) clearTimeout(timeout);
  }
}
