import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { computePayrollForPeriod } from "@/lib/payroll";
import { Badge, Card, PageHeader, Table, Td, Th } from "@/components/ui";
import { PeriodSelect } from "@/components/period-select";
import { formatDate, formatDateRange } from "@/lib/format";
import { formatMoneyPhp } from "@/lib/hr";

export default async function ReportsPayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ payPeriodId?: string }>;
}) {
  await requireUser("ADMIN");
  const { payPeriodId } = await searchParams;

  const periods = await prisma.payPeriod.findMany({
    orderBy: { startDate: "desc" },
  });
  const selected =
    periods.find((p) => p.id === payPeriodId) ??
    periods.find((p) => p.status === "CLOSED") ??
    periods[0];

  if (!selected) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Payroll" />
        <Card>
          No pay periods yet. Create them under{" "}
          <a className="underline" href="/admin/pay-periods">
            Pay Periods
          </a>
          .
        </Card>
      </div>
    );
  }

  const periodPicker = (
    <PeriodSelect
      periods={periods.map((p) => ({
        id: p.id,
        label: `${formatDateRange(p.startDate, p.endDate)} (${p.status})`,
      }))}
      selectedId={selected.id}
    />
  );

  const description =
    "Daily rate (monthly salary ÷ working days in month) × days worked, less absence deductions.";

  if (selected.status !== "CLOSED") {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Payroll" description={description} actions={periodPicker} />
        <Card className="flex flex-col gap-2 text-sm">
          <p className="font-medium">This pay period is still open.</p>
          <p className="text-black/60 dark:text-white/60">
            Payroll is only generated once a period is finalized. Close{" "}
            {formatDateRange(selected.startDate, selected.endDate)} under{" "}
            <a className="underline" href="/admin/pay-periods">
              Pay Periods
            </a>{" "}
            to generate its payroll, or pick a closed period above.
          </p>
        </Card>
      </div>
    );
  }

  const report = await computePayrollForPeriod(selected.id);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Payroll" description={description} actions={periodPicker} />

      <Card className="flex flex-wrap items-center justify-between gap-4 text-sm">
        <p className="text-black/60 dark:text-white/60">
          {formatDateRange(selected.startDate, selected.endDate)} · pay date{" "}
          {formatDate(selected.payDate)} · working days in month:{" "}
          {report.workingDaysMonth}
        </p>
        <a
          href={`/admin/reports/payroll/export?payPeriodId=${selected.id}`}
          className="font-medium underline underline-offset-2"
        >
          Export CSV
        </a>
      </Card>

      {report.warnings.length > 0 && (
        <Card className="flex flex-col gap-1 text-sm">
          {report.warnings.map((w, i) => (
            <p key={i} className="text-amber-700 dark:text-amber-400">
              {w}
            </p>
          ))}
        </Card>
      )}

      <Card className="p-0">
        <Table>
          <thead>
            <tr>
              <Th>Employee</Th>
              <Th>Monthly salary</Th>
              <Th>Present</Th>
              <Th>Absent</Th>
              <Th>Rest days</Th>
              <Th>Total days</Th>
              <Th>Gross pay</Th>
              <Th>Deductions</Th>
              <Th>Net pay</Th>
            </tr>
          </thead>
          <tbody>
            {report.rows.map((r) => (
              <tr
                key={r.employeeId}
                className="border-t border-black/5 dark:border-white/5"
              >
                <Td>
                  {r.employeeName}
                  {r.monthlySalary != null && !r.hasAttendance && (
                    <span className="ml-2">
                      <Badge tone="amber">no attendance</Badge>
                    </span>
                  )}
                  {r.monthlySalary != null && r.attendanceIncomplete && (
                    <span className="ml-2">
                      <Badge tone="amber">attendance incomplete</Badge>
                    </span>
                  )}
                </Td>
                <Td>
                  {r.monthlySalary != null
                    ? formatMoneyPhp(r.monthlySalary)
                    : "—"}
                </Td>
                <Td>{r.present}</Td>
                <Td>{r.absent}</Td>
                <Td>{r.restDay}</Td>
                <Td
                  className={
                    r.attendanceIncomplete
                      ? "text-amber-700 dark:text-amber-400"
                      : undefined
                  }
                >
                  {r.totalDays}
                  <span className="text-black/40 dark:text-white/40">
                    {" "}
                    / {r.expectedWorkingDays}
                  </span>
                </Td>
                <Td>
                  {r.monthlySalary != null ? formatMoneyPhp(r.grossPay) : "—"}
                </Td>
                <Td>{r.deductions > 0 ? formatMoneyPhp(r.deductions) : "None"}</Td>
                <Td className="font-medium">
                  {r.monthlySalary != null ? formatMoneyPhp(r.netPay) : "—"}
                </Td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-black/10 font-medium dark:border-white/10">
              <Td>Total</Td>
              <Td />
              <Td>{report.totals.present}</Td>
              <Td>{report.totals.absent}</Td>
              <Td />
              <Td />
              <Td>{formatMoneyPhp(report.totals.grossPay)}</Td>
              <Td>
                {report.totals.deductions > 0
                  ? formatMoneyPhp(report.totals.deductions)
                  : "None"}
              </Td>
              <Td>{formatMoneyPhp(report.totals.netPay)}</Td>
            </tr>
          </tfoot>
        </Table>
      </Card>
    </div>
  );
}
