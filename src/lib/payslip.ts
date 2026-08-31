import { prisma } from "@/lib/prisma";
import { periodDateFilter } from "@/lib/pay-periods";
import { workingDaysInMonthOf } from "@/lib/working-days";
import { getCompanySettings, type CompanySettings } from "@/lib/company";
import { PayPeriodNotClosedError } from "@/lib/payroll";

export type Payslip = {
  employeeId: string;
  employeeName: string;
  monthlySalary: number | null; // PHP
  present: number;
  absent: number;
  totalDays: number;
  grossPay: number;
  deductions: number;
  netPay: number;
  currency: string;
};

export type PayslipBatch = {
  company: CompanySettings;
  period: { id: string; startDate: Date; endDate: Date; payDate: Date };
  periodLabel: string;
  workingDaysMonth: number;
  payslips: Payslip[];
};

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "August 1-15, 2026" when within one month, else "Aug 1, 2026 – Sep 2, 2026". */
export function payPeriodLabel(start: Date, end: Date): string {
  if (
    start.getUTCFullYear() === end.getUTCFullYear() &&
    start.getUTCMonth() === end.getUTCMonth()
  ) {
    return `${MONTHS[start.getUTCMonth()]} ${start.getUTCDate()}-${end.getUTCDate()}, ${start.getUTCFullYear()}`;
  }
  const fmt = (d: Date) =>
    `${MONTHS[d.getUTCMonth()].slice(0, 3)} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
  return `${fmt(start)} – ${fmt(end)}`;
}

export async function computePayslipsForPeriod(
  payPeriodId: string,
  options: { allowOpen?: boolean } = {}
): Promise<PayslipBatch> {
  const period = await prisma.payPeriod.findUniqueOrThrow({
    where: { id: payPeriodId },
  });
  if (period.status !== "CLOSED" && !options.allowOpen) {
    throw new PayPeriodNotClosedError();
  }

  const [company, people, records] = await Promise.all([
    getCompanySettings(),
    prisma.user.findMany({
      where: { active: true, role: { in: ["EMPLOYEE", "MANAGER"] } },
      select: {
        id: true,
        name: true,
        profile: { select: { salaryPhp: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.attendanceRecord.findMany({
      where: { date: periodDateFilter(period) },
      select: { employeeId: true, status: true },
    }),
  ]);

  const workingDaysMonth = workingDaysInMonthOf(period.startDate);

  const tally = new Map<string, { present: number; absent: number }>();
  for (const r of records) {
    const t = tally.get(r.employeeId) ?? { present: 0, absent: 0 };
    if (r.status === "PRESENT") t.present += 1;
    else if (r.status === "ABSENT") t.absent += 1;
    tally.set(r.employeeId, t);
  }

  const payslips: Payslip[] = people.map((p) => {
    const t = tally.get(p.id) ?? { present: 0, absent: 0 };
    const monthlySalary =
      p.profile?.salaryPhp != null ? Number(p.profile.salaryPhp) : null;

    // daily rate = monthly salary / working days in the month.
    // gross    = daily rate x (present + absent) days
    // deduction = daily rate x absent days
    // net      = gross - deduction  (= daily rate x present days)
    const dailyRate =
      monthlySalary == null ? 0 : monthlySalary / workingDaysMonth;
    const grossPay = round2(dailyRate * (t.present + t.absent));
    const deductions = round2(dailyRate * t.absent);

    return {
      employeeId: p.id,
      employeeName: p.name,
      monthlySalary,
      present: t.present,
      absent: t.absent,
      totalDays: t.present + t.absent,
      grossPay,
      deductions,
      netPay: round2(grossPay - deductions),
      currency: "PHP",
    };
  });

  return {
    company,
    period: {
      id: period.id,
      startDate: period.startDate,
      endDate: period.endDate,
      payDate: period.payDate,
    },
    periodLabel: payPeriodLabel(period.startDate, period.endDate),
    workingDaysMonth,
    payslips,
  };
}
