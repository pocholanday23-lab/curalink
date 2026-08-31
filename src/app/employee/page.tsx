import { redirect } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { Card, PageHeader, Table, Td, Th } from "@/components/ui";
import { ClockWidget } from "@/components/clock-widget";
import { formatDateTime, hoursBetween, formatHours } from "@/lib/format";

export default async function EmployeeClockPage() {
  const user = await requireUser("EMPLOYEE", "MANAGER");

  const profile = await prisma.employeeProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!profile) {
    redirect("/employee/profile/edit?welcome=1");
  }

  const [openEntry, activeAssignments, recentEntries] = await Promise.all([
    prisma.timeEntry.findFirst({
      where: { employeeId: user.id, clockOut: null },
    }),
    prisma.assignment.findMany({
      where: { employeeId: user.id, active: true },
      include: { client: true },
      orderBy: { startDate: "desc" },
    }),
    prisma.timeEntry.findMany({
      where: { employeeId: user.id },
      include: { assignment: { include: { client: true } } },
      orderBy: { clockIn: "desc" },
      take: 15,
    }),
  ]);

  const assignmentOptions = activeAssignments.map((a) => ({
    id: a.id,
    label: a.projectName
      ? `${a.client.name} — ${a.projectName}`
      : a.client.name,
  }));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Clock In / Out"
        description="Track your work hours for your assigned client(s)."
      />

      <div className="grid gap-6 md:grid-cols-[320px_1fr]">
        <Card>
          <ClockWidget
            openEntryClockIn={openEntry?.clockIn.toISOString() ?? null}
            assignments={assignmentOptions}
          />
        </Card>

        <Card className="p-0">
          <div className="border-b border-black/10 px-4 py-3 text-sm font-medium dark:border-white/10">
            Recent entries
          </div>
          <Table>
            <thead>
              <tr>
                <Th>Client / project</Th>
                <Th>Clock in</Th>
                <Th>Clock out</Th>
                <Th>Hours</Th>
              </tr>
            </thead>
            <tbody>
              {recentEntries.length === 0 && (
                <tr>
                  <Td colSpan={4} className="text-black/50">
                    No entries yet.
                  </Td>
                </tr>
              )}
              {recentEntries.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-t border-black/5 dark:border-white/5"
                >
                  <Td>
                    {entry.assignment.projectName
                      ? `${entry.assignment.client.name} — ${entry.assignment.projectName}`
                      : entry.assignment.client.name}
                  </Td>
                  <Td>{formatDateTime(entry.clockIn)}</Td>
                  <Td>
                    {entry.clockOut ? formatDateTime(entry.clockOut) : "—"}
                  </Td>
                  <Td>
                    {entry.clockOut
                      ? formatHours(
                          hoursBetween(entry.clockIn, entry.clockOut)
                        )
                      : "—"}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
