import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { Badge, Button, Card, Field, Input, PageHeader } from "@/components/ui";
import { AttendanceUploadForm } from "@/components/attendance-upload-form";
import { AttendanceTable } from "@/components/attendance-table";
import { enumerateDates, toISODate } from "@/lib/attendance";
import { getAttendanceStatuses } from "@/lib/attendance-derive";
import type { AttendanceStatus } from "@/generated/prisma/client";

function defaultRange() {
  const end = new Date();
  const start = new Date(end.getTime() - 13 * 24 * 60 * 60 * 1000);
  return { start: toISODate(start), end: toISODate(end) };
}

export default async function AdminAttendancePage({
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
  await requireUser("ADMIN");
  const sp = await searchParams;

  const fallback = defaultRange();
  const start = sp.start ?? fallback.start;
  const end = sp.end ?? fallback.end;

  const employees = await prisma.user.findMany({
    where: { role: { in: ["EMPLOYEE", "MANAGER"] }, active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const dates = enumerateDates(new Date(start), new Date(end)).map(toISODate);
  const statuses = await getAttendanceStatuses(
    { startDate: new Date(start), endDate: new Date(end) },
    employees.map((e) => e.id)
  );
  const initialStatuses: Record<string, Record<string, AttendanceStatus>> = {};
  const derivedCells: Record<string, Record<string, boolean>> = {};
  for (const [employeeId, byDate] of statuses) {
    for (const [iso, { status, derived }] of byDate) {
      (initialStatuses[employeeId] ??= {})[iso] = status;
      if (derived) (derivedCells[employeeId] ??= {})[iso] = true;
    }
  }

  const imported = sp.imported ? Number(sp.imported) : null;
  const warningCount = Number(sp.warnings ?? 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Attendance"
        description="Upload attendance workbooks and edit daily status per employee."
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

      <Card className="p-0">
        <form
          method="get"
          className="flex flex-wrap items-end gap-4 border-b border-black/10 px-4 py-3"
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
          derivedCells={derivedCells}
        />
      </Card>
    </div>
  );
}
