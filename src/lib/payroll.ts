import { prisma } from "@/lib/prisma";
import { tallyAttendance } from "@/lib/attendance-derive";
import { weekdaysBetween, workingDaysInMonthOf } from "@/lib/working-days";

export class PayPeriodNotClosedError extends Error {
  constructor() {
    super("Payroll can only be generated for a closed pay period.");
    this.name = "PayPeriodNotClosedError";
  }
}

export type PayrollRow = {
  employeeId: string;
  employeeName: string;
  monthlySalary: number | null; // PHP
  present: number;
  absent: number;
  restDay: number;
  totalDays: number; // present + absent
  expectedWorkingDays: number; // Mon–Fri in the period
  grossPay: number;
  deductions: number;
  netPay: number;
  hasAttendance: boolean;
  attendanceIncomplete: boolean;
};

export type PayrollReport = {
  period: {
    id: string;
    startDate: Date;
    endDate: Date;
    payDate: Date;
    status: string;
  };
  workingDaysMonth: number;
  rows: PayrollRow[];
  totals: {
    grossPay: number;
    deductions: number;
    netPay: number;
    present: number;
    absent: number;
  };
  warnings: string[];
};

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Monthly-salary payroll for a pay period, derived from daily attendance.
 *
 *   workingDaysMonth = Mon–Fri count of the calendar month the period falls in
 *   dailyRate        = monthly salary ÷ workingDaysMonth
 *   grossPay         = dailyRate × (present + absent) days
 *   deductions       = dailyRate × absent days
 *   netPay           = grossPay − deductions
 */
export async function computePayrollForPeriod(
  payPeriodId: string,
  options: { allowOpen?: boolean } = {}
): Promise<PayrollReport> {
  const period = await prisma.payPeriod.findUniqueOrThrow({
    where: { id: payPeriodId },
  });

  if (period.status !== "CLOSED" && !options.allowOpen) {
    throw new PayPeriodNotClosedError();
  }

  const people = await prisma.user.findMany({
    where: { active: true, role: { in: ["EMPLOYEE", "MANAGER"] } },
    select: {
      id: true,
      name: true,
      profile: { select: { salaryPhp: true } },
    },
    orderBy: { name: "asc" },
  });

  const workingDaysMonth = workingDaysInMonthOf(period.startDate);
  const expectedWorkingDays = weekdaysBetween(
    period.startDate,
    period.endDate
  );

  // Present/absent per employee: an explicit AttendanceRecord (Excel import
  // or a manual edit) wins; otherwise a clock in/out punch that day counts as
  // present, and a past weekday with neither counts as absent.
  const tally = await tallyAttendance(
    period,
    people.map((p) => p.id)
  );

  const warnings: string[] = [];
  const rows: PayrollRow[] = people.map((p) => {
    const t = tally.get(p.id) ?? { present: 0, absent: 0, restDay: 0 };
    const totalDays = t.present + t.absent;
    const monthlySalary =
      p.profile?.salaryPhp != null ? Number(p.profile.salaryPhp) : null;
    const attendanceIncomplete =
      totalDays > 0 && totalDays < expectedWorkingDays;

    if (monthlySalary == null) {
      warnings.push(
        `${p.name} has no monthly PHP salary on file — excluded from totals.`
      );
    } else if (totalDays === 0) {
      warnings.push(
        `${p.name}: no attendance recorded this period — gross pay is 0.`
      );
    } else if (attendanceIncomplete) {
      warnings.push(
        `${p.name}: only ${totalDays} of ~${expectedWorkingDays} working days have attendance — days present may be undercounted.`
      );
    }

    // daily rate = monthly salary / working days in the month.
    // gross    = daily rate x (present + absent) days
    // deduction = daily rate x absent days
    // net      = gross - deduction  (= daily rate x present days)
    const dailyRate =
      monthlySalary == null ? 0 : monthlySalary / workingDaysMonth;
    const grossPay = round2(dailyRate * totalDays);
    const deductions = round2(dailyRate * t.absent);

    return {
      employeeId: p.id,
      employeeName: p.name,
      monthlySalary,
      present: t.present,
      absent: t.absent,
      restDay: t.restDay,
      totalDays,
      expectedWorkingDays,
      grossPay,
      deductions,
      netPay: round2(grossPay - deductions),
      hasAttendance: totalDays > 0,
      attendanceIncomplete,
    };
  });

  const totals = rows.reduce(
    (acc, r) => {
      if (r.monthlySalary == null) return acc;
      acc.grossPay = round2(acc.grossPay + r.grossPay);
      acc.deductions = round2(acc.deductions + r.deductions);
      acc.netPay = round2(acc.netPay + r.netPay);
      acc.present += r.present;
      acc.absent += r.absent;
      return acc;
    },
    { grossPay: 0, deductions: 0, netPay: 0, present: 0, absent: 0 }
  );

  return {
    period: {
      id: period.id,
      startDate: period.startDate,
      endDate: period.endDate,
      payDate: period.payDate,
      status: period.status,
    },
    workingDaysMonth,
    rows,
    totals,
    warnings,
  };
}
