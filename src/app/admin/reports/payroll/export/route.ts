import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { computePayrollForPeriod } from "@/lib/payroll";

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toCsv(rows: string[][]) {
  return rows.map((row) => row.map(csvEscape).join(",")).join("\r\n");
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return new Response("Forbidden", { status: 403 });
  }

  const payPeriodId = new URL(request.url).searchParams.get("payPeriodId");
  if (!payPeriodId) {
    return new Response("Missing payPeriodId", { status: 400 });
  }

  const period = await prisma.payPeriod.findUnique({
    where: { id: payPeriodId },
    select: { status: true },
  });
  if (!period) {
    return new Response("Not found", { status: 404 });
  }
  if (period.status !== "CLOSED") {
    return new Response(
      "Payroll can only be generated for a closed pay period.",
      { status: 409 }
    );
  }

  const report = await computePayrollForPeriod(payPeriodId);

  const rows: string[][] = [
    [
      "Employee",
      "Monthly salary (PHP)",
      "Present",
      "Absent",
      "Rest days",
      "Total days",
      "Working days in month",
      "Gross pay (PHP)",
      "Deductions (PHP)",
      "Net pay (PHP)",
    ],
  ];
  for (const r of report.rows) {
    rows.push([
      r.employeeName,
      r.monthlySalary != null ? r.monthlySalary.toFixed(2) : "",
      String(r.present),
      String(r.absent),
      String(r.restDay),
      String(r.totalDays),
      String(report.workingDaysMonth),
      r.monthlySalary != null ? r.grossPay.toFixed(2) : "",
      r.deductions.toFixed(2),
      r.monthlySalary != null ? r.netPay.toFixed(2) : "",
    ]);
  }
  rows.push([
    "TOTAL",
    "",
    String(report.totals.present),
    String(report.totals.absent),
    "",
    "",
    "",
    report.totals.grossPay.toFixed(2),
    report.totals.deductions.toFixed(2),
    report.totals.netPay.toFixed(2),
  ]);

  const start = report.period.startDate.toISOString().slice(0, 10);
  const end = report.period.endDate.toISOString().slice(0, 10);

  return new Response(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="payroll-${start}_${end}.csv"`,
    },
  });
}
