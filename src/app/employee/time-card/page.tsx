import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { PeriodSelect } from "@/components/period-select";
import { PrintButton } from "@/components/print-button";
import {
  AhoraCard,
  AhoraStatRing,
  AhoraTable,
  AhoraTd,
  AhoraTh,
} from "@/components/ahora/ui";
import {
  getAttendanceStatuses,
  manilaISODate,
  type DerivedStatus,
} from "@/lib/attendance-derive";
import { enumerateDates, isWeekend, toISODate } from "@/lib/attendance";
import { formatDate, formatDateRange, formatDateTime, formatHours, hoursBetween } from "@/lib/format";
import { computeTimeLog, type TimeLogEntry } from "@/lib/time-log";
import { weekdaysBetween } from "@/lib/working-days";
import type { AttendanceStatus } from "@/generated/prisma/client";

const STATUS_LABEL: Record<AttendanceStatus, string> = {
  PRESENT: "Present",
  ABSENT: "Absent",
  REST_DAY: "Rest day",
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
    return <AhoraCard>No pay periods have been set up yet.</AhoraCard>;
  }

  const [statuses, timeLog] = await Promise.all([
    getAttendanceStatuses(selected, [user.id]),
    computeTimeLog(selected.id, { employeeIds: [user.id] }),
  ]);
  const byDate = statuses.get(user.id) ?? new Map<string, DerivedStatus>();

  const entriesByDate = new Map<string, TimeLogEntry[]>();
  for (const group of timeLog.groups) {
    for (const entry of group.entries) {
      const iso = manilaISODate(entry.clockIn);
      const list = entriesByDate.get(iso) ?? [];
      list.push(entry);
      entriesByDate.set(iso, list);
    }
  }

  const days = enumerateDates(selected.startDate, selected.endDate).map((d) => {
    const iso = toISODate(d);
    return {
      iso,
      status: byDate.get(iso)?.status ?? null,
      entries: entriesByDate.get(iso) ?? [],
    };
  });

  const present = days.filter((d) => d.status === "PRESENT").length;
  const absent = days.filter((d) => d.status === "ABSENT").length;
  const workdays = weekdaysBetween(selected.startDate, selected.endDate);
  const restday = days.length - workdays;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <PeriodSelect
          periods={periods.map((p) => ({
            id: p.id,
            label: `${formatDateRange(p.startDate, p.endDate)} (${p.status.toLowerCase()})`,
          }))}
          selectedId={selected.id}
          className="!w-auto !rounded-full !border-[var(--ahora-mint-line)] !bg-[var(--ahora-mint)] !text-neutral-900"
        />
        <PrintButton />
      </div>

      <div className="flex flex-wrap items-start justify-center gap-8 sm:justify-start sm:gap-12">
        <AhoraStatRing label="Workdays" value={workdays} color="var(--ahora-ring-workdays)" />
        <AhoraStatRing label="Absences" value={absent} color="var(--ahora-ring-absent)" />
        <AhoraStatRing label="Restday" value={restday} color="var(--ahora-ring-restday)" />
        <AhoraStatRing
          label="Present"
          value={present}
          color="var(--ahora-ring-present)"
          size={148}
        />
      </div>

      <div className="overflow-hidden rounded-2xl">
      <AhoraTable>
        <thead>
          <tr>
            <AhoraTh>Date</AhoraTh>
            <AhoraTh>Day</AhoraTh>
            <AhoraTh>Status</AhoraTh>
            <AhoraTh>Clock in</AhoraTh>
            <AhoraTh>Clock out</AhoraTh>
            <AhoraTh>Hours</AhoraTh>
          </tr>
        </thead>
        <tbody>
          {days.map((d) => (
            <tr key={d.iso}>
              <AhoraTd>{formatDate(d.iso)}</AhoraTd>
              <AhoraTd className="text-neutral-600">{weekday(d.iso)}</AhoraTd>
              <AhoraTd>
                {d.status ? (
                  STATUS_LABEL[d.status]
                ) : (
                  <span className="text-neutral-400">
                    {isWeekend(new Date(d.iso)) ? "—" : "No record"}
                  </span>
                )}
              </AhoraTd>
              {d.entries.length === 0 ? (
                <>
                  <AhoraTd className="text-neutral-400">—</AhoraTd>
                  <AhoraTd className="text-neutral-400">—</AhoraTd>
                  <AhoraTd className="text-neutral-400">—</AhoraTd>
                </>
              ) : (
                <>
                  <AhoraTd>
                    {d.entries.map((e) => (
                      <div key={e.id}>{formatDateTime(e.clockIn)}</div>
                    ))}
                  </AhoraTd>
                  <AhoraTd>
                    {d.entries.map((e) => (
                      <div key={e.id}>
                        {e.clockOut ? formatDateTime(e.clockOut) : "—"}
                      </div>
                    ))}
                  </AhoraTd>
                  <AhoraTd>
                    {d.entries.map((e) => (
                      <div key={e.id}>
                        {e.clockOut
                          ? formatHours(hoursBetween(e.clockIn, e.clockOut))
                          : "—"}
                      </div>
                    ))}
                  </AhoraTd>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </AhoraTable>
      </div>
    </div>
  );
}
