import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let authEventReceived = false;

    // Subscribe first so an auth event cannot be overwritten by a slower
    // getSession() response from the initial render.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      authEventReceived = true;
      if (!active) return;
      setSession(next);
      setAuthError(null);
      setLoading(false);
    });

    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active || authEventReceived) return;
        if (error) {
          setSession(null);
          setAuthError(error.message);
          return;
        }
        setSession(data.session);
        setAuthError(null);
      })
      .catch((error: unknown) => {
        if (!active || authEventReceived) return;
        setSession(null);
        setAuthError(error instanceof Error ? error.message : "Não foi possível recuperar a sessão.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const user: User | null = session?.user ?? null;

  // Record real app activity so the admin dashboard does not mistake an
  // existing signed-in account for a user who has never accessed the app.
  useEffect(() => {
    const userId = user?.id;
    if (!userId) return;

    let pending = false;
    const storageKey = `caminho-divino:last-seen:${userId}`;
    const recordActivity = () => {
      if (pending || document.visibilityState !== "visible") return;
      const now = Date.now();
      try {
        const previous = Number(window.localStorage.getItem(storageKey) ?? 0);
        if (previous && now - previous < 5 * 60 * 1000) return;
        window.localStorage.setItem(storageKey, String(now));
      } catch {
        // Activity tracking must never block normal app usage.
      }

      pending = true;
      void (async () => {
        try {
          const { error } = await supabase.from("profiles")
            .update({ last_seen_at: new Date(now).toISOString() })
            .eq("id", userId);
          if (error) throw error;
        } catch (error) {
          console.warn("[Caminho Divino] Não foi possível registrar o último acesso:", error);
          try {
            if (window.localStorage.getItem(storageKey) === String(now)) {
              window.localStorage.removeItem(storageKey);
            }
          } catch {
            // Ignore storage restrictions; a later activity can retry.
          }
        } finally {
          pending = false;
        }
      })();
    };

    recordActivity();
    window.addEventListener("focus", recordActivity);
    window.addEventListener("pointerdown", recordActivity, { passive: true });
    window.addEventListener("keydown", recordActivity);
    document.addEventListener("visibilitychange", recordActivity);

    return () => {
      window.removeEventListener("focus", recordActivity);
      window.removeEventListener("pointerdown", recordActivity);
      window.removeEventListener("keydown", recordActivity);
      document.removeEventListener("visibilitychange", recordActivity);
    };
  }, [user?.id]);

  return { session, user, loading, authError, isAuthenticated: Boolean(user) };
}

export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = (localStorage.getItem("ccc-theme") as "light" | "dark" | null) ?? "light";
    setTheme(stored);
    document.documentElement.classList.toggle("dark", stored === "dark");
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("ccc-theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  return { theme, toggle };
}
