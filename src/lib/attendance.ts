import type { AttendanceStatus } from "@/generated/prisma/enums";

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  PRESENT: "P",
  ABSENT: "A",
  REST_DAY: "RD",
};

export function parseStatusCell(raw: unknown): AttendanceStatus | "UNKNOWN" | null {
  if (raw === null || raw === undefined) return null;
  const text = String(raw).trim().toUpperCase();
  if (!text) return null;
  if (text === "P" || text === "PRESENT") return "PRESENT";
  if (text === "A" || text === "ABSENT") return "ABSENT";
  if (
    text === "RD" ||
    text === "REST DAY" ||
    text === "RESTDAY" ||
    text === "REST-DAY" ||
    text === "R.D."
  ) {
    return "REST_DAY";
  }
  return "UNKNOWN";
}

export function isWeekend(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

export function toDateOnlyUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function toISODate(date: Date): string {
  return toDateOnlyUTC(date).toISOString().slice(0, 10);
}

export function enumerateDates(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  let cur = toDateOnlyUTC(start);
  const last = toDateOnlyUTC(end);
  while (cur.getTime() <= last.getTime()) {
    dates.push(cur);
    cur = new Date(cur.getTime() + 24 * 60 * 60 * 1000);
  }
  return dates;
}

export function computeAttendanceSummary(
  statuses: (AttendanceStatus | null | undefined)[]
) {
  let worked = 0;
  let absences = 0;
  for (const status of statuses) {
    if (status === "PRESENT") worked += 1;
    else if (status === "ABSENT") absences += 1;
  }
  return { noOfDays: worked + absences, worked, absences };
}
