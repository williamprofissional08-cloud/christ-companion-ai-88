/**
 * Returns the calendar day in Brazil's official Brasília time zone.
 * Using an explicit IANA zone keeps the devotional rollover independent
 * from the device's configured time zone.
 */
export function getBrazilDateISO(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values["year"]}-${values["month"]}-${values["day"]}`;
}


/** Horário de Brasília, independente do fuso horário configurado no celular. */
export function getBrazilHour(now: Date = new Date()): number {
  const part = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now).find((item) => item.type === "hour");
  return Number(part?.value ?? "0");
}

/** Sugestão de leitura; ambas as leituras continuam disponíveis o dia todo. */
export function getBrazilDevotionalPeriod(now: Date = new Date()): "manha" | "noite" {
  return getBrazilHour(now) >= 20 ? "noite" : "manha";
}
