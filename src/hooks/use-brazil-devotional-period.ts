import { useEffect, useState } from "react";
import { getBrazilDevotionalPeriod } from "@/lib/brazil-date";

/** Ajusta o destaque automaticamente às 20h de Brasília sem obrigar recarregar a tela. */
export function useBrazilDevotionalPeriod(): "manha" | "noite" {
  const [period, setPeriod] = useState(getBrazilDevotionalPeriod);

  useEffect(() => {
    const refresh = () => setPeriod(getBrazilDevotionalPeriod());
    const timer = window.setInterval(refresh, 30_000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  return period;
}
