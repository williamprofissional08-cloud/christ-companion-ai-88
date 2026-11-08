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
