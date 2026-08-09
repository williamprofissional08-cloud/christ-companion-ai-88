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

/** Envia um lembrete de teste imediatamente, sem alterar as configurações salvas. */
export async function sendTestReminder() {
  const granted = await requestNotificationPermission();
  if (!granted) return false;
  const message = MESSAGES[new Date().getMinutes() % MESSAGES.length]!;
  new Notification(`${message.title} (teste)`, { body: message.body, tag: "ccc-test" });
  return true;
}

function storageKey(kind: string) {
  return `ccc-reminder-${kind}`;
}

/** Data/hora atual convertidas para o fuso escolhido pelo usuário. */
function zoned(timezone: string) {
  const now = new Date();
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      weekday: "short",
      hour12: false,
    }).formatToParts(now);
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
    const weekdayMap: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };
    return {
      dateKey: `${get("year")}-${get("month")}-${get("day")}`,
      minutes: Number(get("hour")) * 60 + Number(get("minute")),
      weekday: weekdayMap[get("weekday")] ?? now.getDay(),
    };
  } catch {
    return {
      dateKey: now.toDateString(),
      minutes: now.getHours() * 60 + now.getMinutes(),
      weekday: now.getDay(),
    };
  }
}

function allowedToday(repeat: string, weekday: number) {
  if (repeat === "semana") return weekday >= 1 && weekday <= 5;
  if (repeat === "fimdesemana") return weekday === 0 || weekday === 6;
  return true;
}

/** Dispara lembretes diários consistentes no horário, fuso e repetição configurados. */
export function useReminders(settings: UserSettings | undefined) {
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!settings?.reminders_enabled) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;

    const timezone = settings.timezone || "America/Sao_Paulo";
    const repeat = settings.reminder_repeat || "diario";
    const pausedUntil = settings.reminder_paused_until
      ? new Date(settings.reminder_paused_until)
      : null;

    const [hourText, minuteText] = (settings.reminder_time ?? "07:00").split(":");
    const baseMinutes = Number(hourText) * 60 + Number(minuteText);
    const slots = repeat === "duasvezes" ? [baseMinutes, (baseMinutes + 720) % 1440] : [baseMinutes];

    function tick() {
      if (Notification.permission !== "granted") return;
      if (pausedUntil && pausedUntil.getTime() > Date.now()) return;
      const { dateKey, minutes, weekday } = zoned(timezone);
      if (!allowedToday(repeat, weekday)) return;

      slots.forEach((slot, index) => {
        if (minutes < slot) return;
        const key = storageKey(`slot-${index}`);
        if (localStorage.getItem(key) === dateKey) return;
        const message = MESSAGES[(new Date().getDate() + index) % MESSAGES.length]!;
        new Notification(message.title, { body: message.body, tag: `ccc-daily-${index}` });
        localStorage.setItem(key, dateKey);
      });
    }

    tick();
    timer.current = setInterval(tick, 60_000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [
    settings?.reminders_enabled,
    settings?.reminder_time,
    settings?.timezone,
    settings?.reminder_repeat,
    settings?.reminder_paused_until,
  ]);
}
