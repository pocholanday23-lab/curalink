import { prisma } from "@/lib/prisma";
import { enumerateDates, isWeekend, toISODate } from "@/lib/attendance";
import { periodDateFilter, punchPeriodFilter } from "@/lib/pay-periods";
import { APP_TIME_ZONE } from "@/lib/format";
import type { AttendanceStatus } from "@/generated/prisma/client";

/** YYYY-MM-DD for an instant, read in Philippine time. */
export function manilaISODate(instant: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function todayManilaISO(): string {
  return manilaISODate(new Date());
}

export type DerivedStatus = { status: AttendanceStatus; derived: boolean };

/**
 * Attendance status per employee per day over a date range, combining:
 *
 *   1. An explicit AttendanceRecord (Excel import or a manual edit on the
 *      Attendance grid) — always wins, never overwritten.
 *   2. Otherwise, a clock in/out punch that Philippine calendar day -> PRESENT.
 *   3. Otherwise, a past weekday with neither -> ABSENT.
 *   4. Otherwise (today, a future day, or a weekend with nothing) -> no entry.
 *
 * Computed fresh on every call from TimeEntry + AttendanceRecord; nothing is
 * written to the database, so this always reflects the latest punches.
 */
export async function getAttendanceStatuses(
  range: { startDate: Date; endDate: Date },
  employeeIds: string[]
): Promise<Map<string, Map<string, DerivedStatus>>> {
  const result = new Map<string, Map<string, DerivedStatus>>();
  for (const id of employeeIds) result.set(id, new Map());
  if (employeeIds.length === 0) return result;

  const [explicitRecords, punches] = await Promise.all([
    prisma.attendanceRecord.findMany({
      where: { employeeId: { in: employeeIds }, date: periodDateFilter(range) },
      select: { employeeId: true, date: true, status: true },
    }),
    prisma.timeEntry.findMany({
      where: { employeeId: { in: employeeIds }, clockIn: punchPeriodFilter(range) },
      select: { employeeId: true, clockIn: true },
    }),
  ]);

  const key = (employeeId: string, iso: string) => `${employeeId}|${iso}`;

  const explicitByKey = new Map<string, AttendanceStatus>();
  for (const r of explicitRecords) {
    explicitByKey.set(key(r.employeeId, toISODate(r.date)), r.status);
  }

  const punchDays = new Set<string>();
  for (const p of punches) {
    punchDays.add(key(p.employeeId, manilaISODate(p.clockIn)));
  }

  const today = todayManilaISO();
  const days = enumerateDates(range.startDate, range.endDate).map(toISODate);

  for (const employeeId of employeeIds) {
    const map = result.get(employeeId)!;
    for (const iso of days) {
      const k = key(employeeId, iso);
      const explicit = explicitByKey.get(k);
      if (explicit) {
        map.set(iso, { status: explicit, derived: false });
        continue;
      }
      if (punchDays.has(k)) {
        map.set(iso, { status: "PRESENT", derived: true });
        continue;
      }
      if (!isWeekend(new Date(`${iso}T00:00:00Z`)) && iso < today) {
        map.set(iso, { status: "ABSENT", derived: true });
      }
      // Weekend, today (still in progress), or a future day: leave unset.
    }
  }

  return result;
}

export type AttendanceTally = { present: number; absent: number; restDay: number };

/** Present / absent / rest-day counts per employee, built on getAttendanceStatuses. */
export async function tallyAttendance(
  range: { startDate: Date; endDate: Date },
  employeeIds: string[]
): Promise<Map<string, AttendanceTally>> {
  const statuses = await getAttendanceStatuses(range, employeeIds);
  const tally = new Map<string, AttendanceTally>();
  for (const [employeeId, byDate] of statuses) {
    const t: AttendanceTally = { present: 0, absent: 0, restDay: 0 };
    for (const { status } of byDate.values()) {
      if (status === "PRESENT") t.present += 1;
      else if (status === "ABSENT") t.absent += 1;
      else t.restDay += 1;
    }
    tally.set(employeeId, t);
  }
  return tally;
}
