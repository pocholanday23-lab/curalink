import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { Badge, Card, PageHeader, Table, Td, Th } from "@/components/ui";
import { PeriodSelect } from "@/components/period-select";
import { PrintButton } from "@/components/print-button";
import { periodDateFilter } from "@/lib/pay-periods";
import { enumerateDates, isWeekend, toISODate } from "@/lib/attendance";
import { formatDate, formatDateRange } from "@/lib/format";
import { computeTimeLog } from "@/lib/time-log";
import { TimeLogTable } from "@/components/time-log-table";
import type { AttendanceStatus } from "@/generated/prisma/client";

const STATUS: Record<
  AttendanceStatus,
  { label: string; tone: "green" | "red" | "neutral" }
> = {
  PRESENT: { label: "Present", tone: "green" },
  ABSENT: { label: "Absent", tone: "red" },
  REST_DAY: { label: "Rest day", tone: "neutral" },
};

function weekday(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: "UTC",
  }).format(new Date(iso));
}

export default async function TimeCardPage({
  searchParams,
}: {
  searchParams: Promise<{ payPeriodId?: string }>;
}) {
  const user = await requireUser("EMPLOYEE", "MANAGER");
  const { payPeriodId } = await searchParams;

  const periods = await prisma.payPeriod.findMany({
    orderBy: { startDate: "desc" },
  });

  const todayIso = toISODate(new Date());
  const selected =
    periods.find((p) => p.id === payPeriodId) ??
    periods.find(
      (p) => toISODate(p.startDate) <= todayIso && todayIso <= toISODate(p.endDate)
    ) ??
    periods[0];

  if (!selected) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Time card" />
        <Card>No pay periods have been set up yet.</Card>
      </div>
    );
  }

  const records = await prisma.attendanceRecord.findMany({
    where: { employeeId: user.id, date: periodDateFilter(selected) },
    select: { date: true, status: true },
  });
  const byDate = new Map<string, AttendanceStatus>(
    records.map((r) => [toISODate(r.date), r.status])
  );

  const days = enumerateDates(selected.startDate, selected.endDate).map((d) => {
    const iso = toISODate(d);
    return { iso, status: byDate.get(iso) ?? null };
  });

  const count = (s: AttendanceStatus) =>
    days.filter((d) => d.status === s).length;
  const present = count("PRESENT");
  const absent = count("ABSENT");
  const restDay = count("REST_DAY");

  const timeLog = await computeTimeLog(selected.id, {
    employeeIds: [user.id],
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Time card"
        description="Your recorded attendance for the selected pay period."
        actions={
          <div className="flex items-center gap-2">
            <PeriodSelect
              periods={periods.map((p) => ({
                id: p.id,
                label: `${formatDateRange(p.startDate, p.endDate)} (${p.status})`,
              }))}
              selectedId={selected.id}
            />
            <PrintButton />
          </div>
        }
      />

      <Card className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-black/60 dark:text-white/60">
          {formatDateRange(selected.startDate, selected.endDate)} · pay date{" "}
          {formatDate(selected.payDate)}
        </span>
        <span className="mx-1 text-black/20 dark:text-white/20">|</span>
        <Badge tone="green">{present} present</Badge>
        <Badge tone="red">{absent} absent</Badge>
        <Badge>{restDay} rest days</Badge>
        <Badge tone="amber">{present + absent} work days</Badge>
      </Card>

      <Card className="p-0">
        <Table>
          <thead>
            <tr>
              <Th>Date</Th>
              <Th>Day</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {days.map((d) => (
              <tr
                key={d.iso}
                className="border-t border-black/5 dark:border-white/5"
              >
                <Td>{formatDate(d.iso)}</Td>
                <Td className="text-black/60 dark:text-white/60">
                  {weekday(d.iso)}
                </Td>
                <Td>
                  {d.status ? (
                    <Badge tone={STATUS[d.status].tone}>
                      {STATUS[d.status].label}
                    </Badge>
                  ) : (
                    <span className="text-black/40 dark:text-white/40">
                      {isWeekend(new Date(d.iso)) ? "—" : "No record"}
                    </span>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">Clock in / out</h2>
        <TimeLogTable
          groups={timeLog.groups}
          emptyLabel="You have no clock in / out entries for this period."
        />
      </div>
    </div>
  );
}
