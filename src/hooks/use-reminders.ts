import { useEffect, useRef } from "react";
import type { UserSettings } from "@/lib/types";

export async function requestNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  const result = await Notification.requestPermission();
  return result === "granted";
}

const MESSAGES = [
  { title: "Hora da oração", body: "Reserve este momento para falar com Deus (Mateus 6:6)." },
  { title: "Hora do devocional", body: "Seu devocional de hoje está pronto (Salmos 119:105)." },
  { title: "Lembrete de leitura", body: "Continue sua leitura bíblica de hoje (Josué 1:8)." },
  { title: "Desafio espiritual", body: "Coloque a Palavra em prática hoje (Tiago 1:22)." },
];

function storageKey(kind: string) {
  return `ccc-reminder-${kind}`;
}

function alreadySentToday(kind: string) {
  const today = new Date().toDateString();
  return localStorage.getItem(storageKey(kind)) === today;
}

function markSent(kind: string) {
  localStorage.setItem(storageKey(kind), new Date().toDateString());
}

/** Dispara lembretes diários consistentes no horário configurado. */
export function useReminders(settings: UserSettings | undefined) {
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!settings?.reminders_enabled) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;

    const [hourText, minuteText] = (settings.reminder_time ?? "07:00").split(":");
    const hour = Number(hourText);
    const minute = Number(minuteText);

    function tick() {
      if (Notification.permission !== "granted") return;
      const now = new Date();
      const due = now.getHours() * 60 + now.getMinutes() >= hour * 60 + minute;
      if (!due || alreadySentToday("daily")) return;
      const message = MESSAGES[now.getDate() % MESSAGES.length]!;
      new Notification(message.title, { body: message.body, tag: "ccc-daily" });
      markSent("daily");
    }

    tick();
    timer.current = setInterval(tick, 60_000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [settings?.reminders_enabled, settings?.reminder_time]);
}
