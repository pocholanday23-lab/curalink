import { prisma } from "@/lib/prisma";
import { periodDateFilter } from "@/lib/pay-periods";
import { workingDaysInMonthOf } from "@/lib/working-days";
import { getCompanySettings } from "@/lib/company";
import type { ClientInvoiceLine } from "@/lib/types";

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function shortPeriodLabel(start: Date, end: Date): string {
  const a = `${MONTHS_SHORT[start.getUTCMonth()]} ${start.getUTCDate()}`;
  const b =
    start.getUTCMonth() === end.getUTCMonth()
      ? `${end.getUTCDate()}`
      : `${MONTHS_SHORT[end.getUTCMonth()]} ${end.getUTCDate()}`;
  return `${a}-${b}`;
}

/** Next "INV-NNN" from the highest existing one (zero-padded to 3). */
export async function nextInvoiceNumber(): Promise<string> {
  const invoices = await prisma.clientInvoice.findMany({
    select: { number: true },
  });
  let max = 0;
  for (const { number } of invoices) {
    const m = number.match(/(\d+)\s*$/);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `INV-${String(max + 1).padStart(3, "0")}`;
}

type SalariedPerson = {
  id: string;
  name: string;
  lastName: string | null;
  firstName: string | null;
  salaryUsd: number | null;
};

async function salariedPeople(): Promise<SalariedPerson[]> {
  const rows = await prisma.user.findMany({
    where: { active: true, role: { in: ["EMPLOYEE", "MANAGER"] } },
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      profile: { select: { salaryUsd: true } },
    },
    orderBy: { name: "asc" },
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    firstName: r.firstName,
    lastName: r.lastName,
    salaryUsd: r.profile?.salaryUsd != null ? Number(r.profile.salaryUsd) : null,
  }));
}

async function periodsById(ids: string[]) {
  const periods = await prisma.payPeriod.findMany({
    where: { id: { in: ids } },
    orderBy: { startDate: "asc" },
  });
  return periods;
}

async function presentDaysByPersonPeriod(periodIds: string[]) {
  // Map<periodId, Map<employeeId, presentCount>>
  const result = new Map<string, Map<string, number>>();
  const periods = await periodsById(periodIds);
  for (const p of periods) {
    const records = await prisma.attendanceRecord.findMany({
      where: { date: periodDateFilter(p), status: "PRESENT" },
      select: { employeeId: true },
    });
    const counts = new Map<string, number>();
    for (const r of records) {
      counts.set(r.employeeId, (counts.get(r.employeeId) ?? 0) + 1);
    }
    result.set(p.id, counts);
  }
  return { periods, presentByPeriod: result };
}

/** Pre-filled invoice lines the system can compute from selected closed periods. */
export async function suggestInvoiceLines(input: {
  payPeriodIds: string[];
}): Promise<ClientInvoiceLine[]> {
  const [company, people] = await Promise.all([
    getCompanySettings(),
    salariedPeople(),
  ]);

  const lines: ClientInvoiceLine[] = [];

  if (input.payPeriodIds.length > 0) {
    const { periods, presentByPeriod } = await presentDaysByPersonPeriod(
      input.payPeriodIds
    );
    if (periods.length > 0) {
      const first = periods[0];
      const last = periods[periods.length - 1];
      const maxDays = workingDaysInMonthOf(last.startDate);

      let actualCost = 0;
      for (const person of people) {
        if (person.salaryUsd == null) continue;
        let present = 0;
        for (const p of periods) {
          present += presentByPeriod.get(p.id)?.get(person.id) ?? 0;
        }
        const payout = Math.min(
          round2((person.salaryUsd * present) / maxDays),
          person.salaryUsd
        );
        actualCost += payout;
      }

      lines.push({
        description: "Actual Cost of Salary",
        coverage: shortPeriodLabel(first.startDate, last.endDate),
        amount: round2(actualCost),
      });
    }
  }

  const advanceSalary = round2(
    people.reduce((sum, p) => sum + (p.salaryUsd ?? 0), 0)
  );
  lines.push({
    description: "Advance Salary",
    coverage: "",
    amount: advanceSalary,
  });
  lines.push({
    description: `Service Charge (${company.serviceChargePct}%)`,
    coverage: "",
    amount: round2((advanceSalary * company.serviceChargePct) / 100),
  });

  return lines;
}

export type InvoiceBreakdown = {
  periodColumns: { id: string; label: string }[];
  maxDays: number;
  actuals: {
    employeeId: string;
    lastName: string;
    firstName: string;
    daysByPeriod: Record<string, number>;
    totalDays: number;
    maxPayout: number;
    payout: number;
  }[];
  actualsTotals: { maxPayout: number; payout: number };
  projections: { lastName: string; firstName: string; salary: number }[];
  projectionsTotal: number;
};

/** Supporting "Breakdown" section for the printed invoice (Payroll Actuals + Projections). */
export async function computeInvoiceBreakdown(
  payPeriodIds: string[]
): Promise<InvoiceBreakdown | null> {
  const people = await salariedPeople();
  if (payPeriodIds.length === 0) return null;

  const { periods, presentByPeriod } = await presentDaysByPersonPeriod(
    payPeriodIds
  );
  if (periods.length === 0) return null;

  const last = periods[periods.length - 1];
  const maxDays = workingDaysInMonthOf(last.startDate);

  const periodColumns = periods.map((p) => ({
    id: p.id,
    label: shortPeriodLabel(p.startDate, p.endDate),
  }));

  const actuals = people
    .filter((p) => p.salaryUsd != null)
    .map((person) => {
      const daysByPeriod: Record<string, number> = {};
      let totalDays = 0;
      for (const p of periods) {
        const d = presentByPeriod.get(p.id)?.get(person.id) ?? 0;
        daysByPeriod[p.id] = d;
        totalDays += d;
      }
      const maxPayout = person.salaryUsd as number;
      const payout = Math.min(
        round2((maxPayout * totalDays) / maxDays),
        maxPayout
      );
      return {
        employeeId: person.id,
        lastName: person.lastName ?? person.name,
        firstName: person.firstName ?? "",
        daysByPeriod,
        totalDays,
        maxPayout,
        payout,
      };
    });

  const actualsTotals = actuals.reduce(
    (acc, r) => ({
      maxPayout: round2(acc.maxPayout + r.maxPayout),
      payout: round2(acc.payout + r.payout),
    }),
    { maxPayout: 0, payout: 0 }
  );

  const projections = people
    .filter((p) => p.salaryUsd != null)
    .map((p) => ({
      lastName: p.lastName ?? p.name,
      firstName: p.firstName ?? "",
      salary: p.salaryUsd as number,
    }));
  const projectionsTotal = round2(
    projections.reduce((sum, p) => sum + p.salary, 0)
  );

  return {
    periodColumns,
    maxDays,
    actuals,
    actualsTotals,
    projections,
    projectionsTotal,
  };
}
