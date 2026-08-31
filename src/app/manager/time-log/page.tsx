import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { Badge, Button, Card, Field, PageHeader, Select } from "@/components/ui";
import { TimeLogTable } from "@/components/time-log-table";
import { computeTimeLog } from "@/lib/time-log";
import { formatDateRange, formatHours } from "@/lib/format";

export default async function ManagerTimeLogPage({
  searchParams,
}: {
  searchParams: Promise<{ payPeriodId?: string; employeeId?: string }>;
}) {
  const manager = await requireUser("MANAGER");
  const sp = await searchParams;

  const [periods, reports] = await Promise.all([
    prisma.payPeriod.findMany({ orderBy: { startDate: "desc" } }),
    prisma.user.findMany({
      where: { managerId: manager.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const people = [{ id: manager.id, name: `${manager.name} (me)` }, ...reports];
  const allowedIds = new Set(people.map((p) => p.id));

  const selected =
    periods.find((p) => p.id === sp.payPeriodId) ?? periods[0];
  const employeeId =
    sp.employeeId && allowedIds.has(sp.employeeId) ? sp.employeeId : "";

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
          <option value="">My team</option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
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
        <PageHeader title="Team time log" />
        <Card>No pay periods have been set up yet.</Card>
      </div>
    );
  }

  const report = await computeTimeLog(selected.id, {
    employeeIds: employeeId
      ? [employeeId]
      : [manager.id, ...reports.map((r) => r.id)],
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Team time log"
        description="Clock in / out entries for your team, per pay period."
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
