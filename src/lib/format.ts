/**
 * The company operates in the Philippines. Every timestamp is stored as a
 * universal instant (UTC) and rendered here in Philippine Standard Time
 * (UTC+8, no DST) so it reads the same no matter where the server or the
 * viewer's browser is.
 */
export const APP_TIME_ZONE = "Asia/Manila";

export function hoursBetween(start: Date, end: Date): number {
  return Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60));
}

export function formatHours(hours: number): string {
  return `${hours.toFixed(2)}h`;
}

export function formatCurrency(amount: number | string): string {
  const value = typeof amount === "string" ? Number(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: APP_TIME_ZONE,
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: APP_TIME_ZONE,
  }).format(new Date(date));
}

export function formatTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: APP_TIME_ZONE,
  }).format(new Date(date));
}

export function formatDateRange(start: Date | string, end: Date | string) {
  return `${formatDate(start)} – ${formatDate(end)}`;
}
