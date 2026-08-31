import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { Badge, Button, Card, Field, Input, PageHeader } from "@/components/ui";
import { AttendanceUploadForm } from "@/components/attendance-upload-form";
import { AttendanceTable } from "@/components/attendance-table";
import { enumerateDates, toISODate } from "@/lib/attendance";
import type { AttendanceStatus } from "@/generated/prisma/client";

function defaultRange() {
  const end = new Date();
  const start = new Date(end.getTime() - 13 * 24 * 60 * 60 * 1000);
  return { start: toISODate(start), end: toISODate(end) };
}

export default async function ManagerAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{
    start?: string;
    end?: string;
    imported?: string;
    created?: string;
    matched?: string;
    warnings?: string;
  }>;
}) {
  const user = await requireUser("MANAGER");
  const sp = await searchParams;

  const fallback = defaultRange();
  const start = sp.start ?? fallback.start;
  const end = sp.end ?? fallback.end;

  const [employees, records] = await Promise.all([
    prisma.user.findMany({
      where: { managerId: user.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.attendanceRecord.findMany({
      where: {
        date: { gte: new Date(start), lte: new Date(end) },
        employee: { managerId: user.id },
      },
      select: { employeeId: true, date: true, status: true },
    }),
  ]);

  const dates = enumerateDates(new Date(start), new Date(end)).map(toISODate);
  const initialStatuses: Record<string, Record<string, AttendanceStatus>> = {};
  for (const r of records) {
    const iso = toISODate(r.date);
    (initialStatuses[r.employeeId] ??= {})[iso] = r.status;
  }

  const imported = sp.imported ? Number(sp.imported) : null;
  const warningCount = Number(sp.warnings ?? 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Attendance"
        description="Upload attendance workbooks and edit daily status for your direct reports."
      />

      <Card className="flex flex-col gap-4">
        <span className="text-sm font-medium">Upload attendance workbook</span>
        <AttendanceUploadForm />
      </Card>

      {imported !== null && (
        <Card className="flex flex-wrap items-center gap-2 text-sm">
          <Badge tone="green">Imported {imported} records</Badge>
          <Badge>{sp.created ?? 0} employees created</Badge>
          <Badge>{sp.matched ?? 0} employees matched</Badge>
          {warningCount > 0 && (
            <Badge tone="amber">
              {warningCount} warning{warningCount === 1 ? "" : "s"} — some rows may
              need review
            </Badge>
          )}
        </Card>
      )}

      {employees.length === 0 ? (
        <Card>You have no direct reports assigned.</Card>
      ) : (
        <Card className="p-0">
          <form
            method="get"
            className="flex flex-wrap items-end gap-4 border-b border-black/10 px-4 py-3 dark:border-white/10"
          >
            <Field label="Start date" htmlFor="start">
              <Input id="start" name="start" type="date" defaultValue={start} />
            </Field>
            <Field label="End date" htmlFor="end">
              <Input id="end" name="end" type="date" defaultValue={end} />
            </Field>
            <Button type="submit" variant="secondary">
              View range
            </Button>
          </form>
          <AttendanceTable
            employees={employees}
            dates={dates}
            initialStatuses={initialStatuses}
          />
        </Card>
      )}
    </div>
  );
}
