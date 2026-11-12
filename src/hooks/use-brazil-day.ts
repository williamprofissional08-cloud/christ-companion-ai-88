import { useEffect, useState } from "react";
import { getBrazilDateISO } from "@/lib/brazil-date";

/**
 * Tracks the Brazilian calendar day while the app remains open.
 * The short interval handles the midnight boundary; focus/visibility
 * listeners also recover immediately after a suspended background tab.
 */
export function useBrazilDay(): string {
  const [day, setDay] = useState(getBrazilDateISO);

  useEffect(() => {
    const refreshDay = () => {
      const currentDay = getBrazilDateISO();
      setDay((previousDay) => previousDay === currentDay ? previousDay : currentDay);
    };

    const intervalId = window.setInterval(refreshDay, 15_000);
    window.addEventListener("focus", refreshDay);
    document.addEventListener("visibilitychange", refreshDay);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshDay);
      document.removeEventListener("visibilitychange", refreshDay);
    };
  }, []);

  return day;
}
