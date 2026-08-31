import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { Badge, Button, Card, Field, PageHeader, Select } from "@/components/ui";
import { TimeLogTable } from "@/components/time-log-table";
import { computeTimeLog } from "@/lib/time-log";
import { formatDateRange, formatHours } from "@/lib/format";

export default async function AdminTimeLogPage({
  searchParams,
}: {
  searchParams: Promise<{ payPeriodId?: string; employeeId?: string }>;
}) {
  await requireUser("ADMIN");
  const sp = await searchParams;

  const [periods, employees] = await Promise.all([
    prisma.payPeriod.findMany({ orderBy: { startDate: "desc" } }),
    prisma.user.findMany({
      where: { role: { in: ["EMPLOYEE", "MANAGER"] } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const selected =
    periods.find((p) => p.id === sp.payPeriodId) ?? periods[0];
  const employeeId =
    sp.employeeId && employees.some((e) => e.id === sp.employeeId)
      ? sp.employeeId
      : "";

  const filters = (
    <form method="get" className="flex flex-wrap items-end gap-3">
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
        <Select id="employeeId" name="employeeId" defaultValue={employeeId}>
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
        <PageHeader title="Time log" />
        <Card>No pay periods have been set up yet.</Card>
      </div>
    );
  }

  const report = await computeTimeLog(selected.id, {
    employeeIds: employeeId ? [employeeId] : undefined,
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Time log"
        description="Clock in / out entries per pay period, filterable by employee."
      />
      <Card>{filters}</Card>
      <Card className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-black/60 dark:text-white/60">
          {formatDateRange(selected.startDate, selected.endDate)}
        </span>
        <Badge tone="amber">{formatHours(report.totalHours)} total</Badge>
      </Card>
      <TimeLogTable groups={report.groups} />
    </div>
  );
}
