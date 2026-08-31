import { prisma } from "@/lib/prisma";
import { periodDateFilter } from "@/lib/pay-periods";
import { hoursBetween } from "@/lib/format";

export type TimeLogEntry = {
  id: string;
  clientLabel: string;
  clockIn: Date;
  clockOut: Date | null;
  hours: number | null;
  notes: string | null;
};

export type TimeLogGroup = {
  employeeId: string;
  employeeName: string;
  entries: TimeLogEntry[];
  totalHours: number;
};

export type TimeLogReport = {
  period: { id: string; startDate: Date; endDate: Date; payDate: Date; status: string };
  groups: TimeLogGroup[];
  totalHours: number;
};

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Clock in / out entries for a pay period, grouped by employee.
 * `employeeIds` restricts the result (e.g. a manager's reports); omit for everyone.
 */
export async function computeTimeLog(
  payPeriodId: string,
  opts: { employeeIds?: string[] } = {}
): Promise<TimeLogReport> {
  const period = await prisma.payPeriod.findUniqueOrThrow({
    where: { id: payPeriodId },
  });

  const entries =
    opts.employeeIds && opts.employeeIds.length === 0
      ? []
      : await prisma.timeEntry.findMany({
          where: {
            clockIn: periodDateFilter(period),
            ...(opts.employeeIds
              ? { employeeId: { in: opts.employeeIds } }
              : {}),
          },
          include: {
            employee: { select: { id: true, name: true } },
            assignment: { include: { client: true } },
          },
          orderBy: [{ employee: { name: "asc" } }, { clockIn: "asc" }],
        });

  const byEmployee = new Map<string, TimeLogGroup>();
  for (const e of entries) {
    const hours = e.clockOut ? round2(hoursBetween(e.clockIn, e.clockOut)) : null;
    const group =
      byEmployee.get(e.employeeId) ??
      ({
        employeeId: e.employeeId,
        employeeName: e.employee.name,
        entries: [],
        totalHours: 0,
      } satisfies TimeLogGroup);
    group.entries.push({
      id: e.id,
      clientLabel: e.assignment.projectName
        ? `${e.assignment.client.name} — ${e.assignment.projectName}`
        : e.assignment.client.name,
      clockIn: e.clockIn,
      clockOut: e.clockOut,
      hours,
      notes: e.notes,
    });
    if (hours) group.totalHours = round2(group.totalHours + hours);
    byEmployee.set(e.employeeId, group);
  }

  const groups = [...byEmployee.values()];
  const totalHours = round2(
    groups.reduce((sum, g) => sum + g.totalHours, 0)
  );

  return {
    period: {
      id: period.id,
      startDate: period.startDate,
      endDate: period.endDate,
      payDate: period.payDate,
      status: period.status,
    },
    groups,
    totalHours,
  };
}
