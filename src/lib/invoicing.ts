import { prisma } from "@/lib/prisma";
import { getCompanySettings } from "@/lib/company";
import type { ClientInvoiceLine } from "@/lib/types";

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function dayLabel(d: Date): string {
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

/** "August 27 - September 26" (year omitted unless the span crosses a year end). */
export function cycleLabel(from: Date, to: Date): string {
  const base = `${dayLabel(from)} - ${dayLabel(to)}`;
  return from.getUTCFullYear() === to.getUTCFullYear()
    ? base
    : `${dayLabel(from)}, ${from.getUTCFullYear()} - ${dayLabel(to)}, ${to.getUTCFullYear()}`;
}

/** The advance cycle = the day after `billedTo`, running one calendar month. */
export function advanceCycleAfter(billedTo: Date): { from: Date; to: Date } {
  const from = new Date(
    Date.UTC(billedTo.getUTCFullYear(), billedTo.getUTCMonth(), billedTo.getUTCDate() + 1)
  );
  const to = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, from.getUTCDate() - 1)
  );
  return { from, to };
}

/** Default billed cycle for a new invoice: prev month's 27th → this month's 26th. */
export function defaultBilledCycle(today = new Date()): { from: Date; to: Date } {
  const y = today.getUTCFullYear();
  const m = today.getUTCMonth();
  return {
    from: new Date(Date.UTC(y, m - 1, 27)),
    to: new Date(Date.UTC(y, m, 26)),
  };
}

/** Next "INV-NNN" from the highest existing one (zero-padded to 3). */
export async function nextInvoiceNumber(): Promise<string> {
  const invoices = await prisma.clientInvoice.findMany({ select: { number: true } });
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
  firstName: string | null;
  lastName: string | null;
  active: boolean;
  salaryUsd: number | null;
};

async function allSalariedPeople(): Promise<SalariedPerson[]> {
  const rows = await prisma.user.findMany({
    where: { role: { in: ["EMPLOYEE", "MANAGER"] } },
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      active: true,
      profile: { select: { salaryUsd: true } },
    },
    orderBy: { name: "asc" },
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    firstName: r.firstName,
    lastName: r.lastName,
    active: r.active,
    salaryUsd: r.profile?.salaryUsd != null ? Number(r.profile.salaryUsd) : null,
  }));
}

/**
 * Split for a billed date range: "actuals" (what was billed for work already
 * done) must include people who've since gone inactive but had attendance in
 * that range — this is a historical record. "Projections" (the next cycle's
 * advance) is forward-looking and correctly stays limited to currently-active
 * people, since you don't advance-pay someone who's already left.
 */
function splitForRange(
  people: SalariedPerson[],
  attendance: Map<string, { present: number; absent: number }>
): { actuals: SalariedPerson[]; projections: SalariedPerson[] } {
  const actuals = people.filter((p) => {
    if (p.active) return true;
    const t = attendance.get(p.id);
    return !!t && t.present + t.absent > 0;
  });
  return { actuals, projections: people.filter((p) => p.active) };
}

/** Present / absent day counts per employee over a date range (inclusive). */
async function attendanceInRange(from: Date, to: Date) {
  const records = await prisma.attendanceRecord.findMany({
    where: {
      date: {
        gte: from,
        lt: new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate() + 1)),
      },
      status: { in: ["PRESENT", "ABSENT"] },
    },
    select: { employeeId: true, status: true },
  });
  const map = new Map<string, { present: number; absent: number }>();
  for (const r of records) {
    const t = map.get(r.employeeId) ?? { present: 0, absent: 0 };
    if (r.status === "PRESENT") t.present += 1;
    else t.absent += 1;
    map.set(r.employeeId, t);
  }
  return map;
}

export type SuggestedInvoice = {
  lines: ClientInvoiceLine[];
  warnings: string[];
};

/**
 * Builds the standard Curalink invoice lines:
 *   1. Advance Salary (Paid)  — negative; the advance from the previous invoice
 *   2. Actual Cost of Salary  — Σ (monthly USD rate × present ÷ (present + absent)) over [billedFrom, billedTo]
 *   3. Advance Salary         — Σ monthly USD rate of active staff, for the next cycle
 *   4. Service Charge (N%)    — N% of line 3
 * The admin can add / edit / remove lines afterwards.
 */
export async function suggestInvoiceLines(input: {
  billedFrom: Date;
  billedTo: Date;
  previousInvoiceId: string | null;
}): Promise<SuggestedInvoice> {
  const { billedFrom, billedTo } = input;
  const [company, allPeople, attendance] = await Promise.all([
    getCompanySettings(),
    allSalariedPeople(),
    attendanceInRange(billedFrom, billedTo),
  ]);
  const { actuals: actualsPeople, projections: activePeople } = splitForRange(
    allPeople,
    attendance
  );

  const warnings: string[] = [];
  const lines: ClientInvoiceLine[] = [];
  const billedLabel = cycleLabel(billedFrom, billedTo);
  const adv = advanceCycleAfter(billedTo);
  const advLabel = cycleLabel(adv.from, adv.to);

  // 1. Advance Salary (Paid) — from the referenced previous invoice
  if (input.previousInvoiceId) {
    const prev = await prisma.clientInvoice.findUnique({
      where: { id: input.previousInvoiceId },
    });
    const prevLines = (prev?.lineItems as unknown as ClientInvoiceLine[]) ?? [];
    const advLine = prevLines.find(
      (l) => /^advance salary\s*$/i.test(l.description.trim())
    );
    if (advLine) {
      lines.push({
        description: "Advance Salary (Paid)",
        coverage: advLine.coverage || billedLabel,
        amount: -Math.abs(round2(advLine.amount)),
      });
    } else {
      warnings.push(
        "The previous invoice has no plain “Advance Salary” line to carry over — add item 1 by hand."
      );
    }
  } else {
    warnings.push(
      "No previous invoice selected — add the “Advance Salary (Paid)” line by hand."
    );
  }

  // 2. Actual Cost of Salary
  let actualCost = 0;
  for (const person of actualsPeople) {
    if (person.salaryUsd == null) {
      warnings.push(`${person.name} has no monthly USD rate on file — not included in Actual Cost of Salary.`);
      continue;
    }
    const t = attendance.get(person.id) ?? { present: 0, absent: 0 };
    const worked = t.present + t.absent;
    if (worked === 0) {
      warnings.push(`${person.name} has no attendance in ${billedLabel} — counted as 0.`);
      continue;
    }
    actualCost += round2((person.salaryUsd * t.present) / worked);
  }
  lines.push({
    description: "Actual Cost of Salary",
    coverage: billedLabel,
    amount: round2(actualCost),
  });

  // 3. Advance Salary (next cycle)
  const advanceSalary = round2(
    activePeople.reduce((sum, p) => sum + (p.salaryUsd ?? 0), 0)
  );
  lines.push({
    description: "Advance Salary",
    coverage: advLabel,
    amount: advanceSalary,
  });

  // 4. Service Charge
  lines.push({
    description: `Service Charge (${company.serviceChargePct}%)`,
    coverage: advLabel,
    amount: round2((advanceSalary * company.serviceChargePct) / 100),
  });

  return { lines, warnings };
}

export type InvoiceBreakdown = {
  cycleLabel: string;
  actuals: {
    lastName: string;
    firstName: string;
    present: number;
    absent: number;
    worked: number;
    rate: number;
    payout: number;
  }[];
  actualsTotals: { rate: number; payout: number };
  projections: { lastName: string; firstName: string; salary: number }[];
  projectionsTotal: number;
};

/** Supporting "Breakdown" page: per-person proration for the billed cycle + next-cycle projection. */
export async function computeInvoiceBreakdown(
  billedFrom: Date | null,
  billedTo: Date | null
): Promise<InvoiceBreakdown | null> {
  if (!billedFrom || !billedTo) return null;

  const [allPeople, attendance] = await Promise.all([
    allSalariedPeople(),
    attendanceInRange(billedFrom, billedTo),
  ]);
  const { actuals: actualsPeople, projections: activePeople } = splitForRange(
    allPeople,
    attendance
  );
  const salariedActuals = actualsPeople.filter((p) => p.salaryUsd != null);
  const salariedProjections = activePeople.filter((p) => p.salaryUsd != null);
  if (salariedActuals.length === 0 && salariedProjections.length === 0) {
    return null;
  }

  const actuals = salariedActuals.map((p) => {
    const t = attendance.get(p.id) ?? { present: 0, absent: 0 };
    const worked = t.present + t.absent;
    const rate = p.salaryUsd as number;
    const payout = worked > 0 ? round2((rate * t.present) / worked) : 0;
    return {
      lastName: p.lastName ?? p.name,
      firstName: p.firstName ?? "",
      present: t.present,
      absent: t.absent,
      worked,
      rate,
      payout,
    };
  });

  const actualsTotals = actuals.reduce(
    (acc, r) => ({
      rate: round2(acc.rate + r.rate),
      payout: round2(acc.payout + r.payout),
    }),
    { rate: 0, payout: 0 }
  );

  const projections = salariedProjections.map((p) => ({
    lastName: p.lastName ?? p.name,
    firstName: p.firstName ?? "",
    salary: p.salaryUsd as number,
  }));

  return {
    cycleLabel: cycleLabel(billedFrom, billedTo),
    actuals,
    actualsTotals,
    projections,
    projectionsTotal: round2(projections.reduce((s, p) => s + p.salary, 0)),
  };
}
