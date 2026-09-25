import { redirect } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { ClockWidget } from "@/components/clock-widget";

export default async function EmployeeClockPage() {
  const user = await requireUser("EMPLOYEE", "MANAGER");

  const profile = await prisma.employeeProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!profile) {
    redirect("/employee/profile/edit?welcome=1");
  }

  const [openEntry, activeAssignments] = await Promise.all([
    prisma.timeEntry.findFirst({
      where: { employeeId: user.id, clockOut: null },
    }),
    prisma.assignment.findMany({
      where: { employeeId: user.id, active: true },
      include: { client: true },
      orderBy: { startDate: "desc" },
    }),
  ]);

  const assignmentOptions = activeAssignments.map((a) => ({
    id: a.id,
    label: a.projectName
      ? `${a.client.name} — ${a.projectName}`
      : a.client.name,
  }));

  return (
    <div className="flex min-h-[50vh] items-start justify-center pt-10 sm:pt-16">
      <div className="w-full max-w-xs">
        <ClockWidget
          openEntryClockIn={openEntry?.clockIn.toISOString() ?? null}
          assignments={assignmentOptions}
        />
      </div>
    </div>
  );
}
