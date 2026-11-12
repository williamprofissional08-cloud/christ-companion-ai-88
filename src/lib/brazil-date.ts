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
  return `${values.year}-${values.month}-${values.day}`;
}
