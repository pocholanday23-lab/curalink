import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { computePayslipsForPeriod } from "@/lib/payslip";
import { Button, Card, Field, PageHeader, Select } from "@/components/ui";
import { PrintButton } from "@/components/print-button";
import { PayslipDocument } from "@/components/payslip-document";
import { formatDateRange } from "@/lib/format";

export default async function ReportsPayslipsPage({
  searchParams,
}: {
  searchParams: Promise<{ payPeriodId?: string; employeeId?: string }>;
}) {
  await requireUser("ADMIN");
  const sp = await searchParams;

  const periods = await prisma.payPeriod.findMany({
    orderBy: { startDate: "desc" },
  });
  const selected =
    periods.find((p) => p.id === sp.payPeriodId) ??
    periods.find((p) => p.status === "CLOSED") ??
    periods[0];

  const employees = await prisma.user.findMany({
    where: { active: true, role: { in: ["EMPLOYEE", "MANAGER"] } },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const filters = (
    <form method="get" className="flex flex-wrap items-end gap-3 print:hidden">
      <Field label="Pay period" htmlFor="payPeriodId">
        <Select
          id="payPeriodId"
          name="payPeriodId"
          defaultValue={selected?.id ?? ""}
        >
          {periods.map((p) => (
            <option key={p.id} value={p.id}>
              {formatDateRange(p.startDate, p.endDate)} ({p.status})
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Employee" htmlFor="employeeId">
        <Select
          id="employeeId"
          name="employeeId"
          defaultValue={sp.employeeId ?? ""}
        >
          <option value="">All employees</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </Select>
      </Field>
      <Button type="submit" variant="secondary">
        View
      </Button>
    </form>
  );

  if (!selected) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Payslips" />
        <Card>No pay periods yet.</Card>
      </div>
    );
  }

  if (selected.status !== "CLOSED") {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Payslips"
          description="Per-employee payslips for a closed pay period."
        />
        <Card>{filters}</Card>
        <Card className="text-sm text-black/60 dark:text-white/60">
          {formatDateRange(selected.startDate, selected.endDate)} is still open.
          Close it under Pay Periods to generate payslips.
        </Card>
      </div>
    );
  }

  const batch = await computePayslipsForPeriod(selected.id);
  const shown = sp.employeeId
    ? batch.payslips.filter((p) => p.employeeId === sp.employeeId)
    : batch.payslips;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Payslips"
        description={`${batch.periodLabel} · ${shown.length} payslip${
          shown.length === 1 ? "" : "s"
        }`}
        actions={<PrintButton />}
      />
      <Card className="print:hidden">{filters}</Card>

      <div className="flex flex-col gap-8">
        {shown.map((p) => (
          <Card key={p.employeeId} className="print:border-0 print:shadow-none print:p-0">
            <PayslipDocument
              company={batch.company}
              payslip={p}
              periodLabel={batch.periodLabel}
              dateProcessed={batch.period.payDate}
              workingDaysMonth={batch.workingDaysMonth}
            />
          </Card>
        ))}
      </div>
    </div>
  );
}
