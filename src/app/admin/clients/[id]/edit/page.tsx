import { notFound } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { Card, PageHeader } from "@/components/ui";
import { ClientForm } from "@/components/client-form";
import { ClientAssignments } from "@/components/client-assignments";
import { updateClientAction } from "@/lib/actions/clients";
import { createAssignmentForClientAction } from "@/lib/actions/assignments";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireUser("ADMIN");

  const [client, employees] = await Promise.all([
    prisma.client.findUnique({
      where: { id },
      include: {
        assignments: {
          include: { employee: { select: { name: true } } },
          orderBy: [{ active: "desc" }, { startDate: "desc" }],
        },
      },
    }),
    prisma.user.findMany({
      where: { role: { in: ["EMPLOYEE", "MANAGER"] }, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  if (!client) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={`Edit ${client.name}`} />

      <Card className="max-w-lg">
        <ClientForm
          mode="edit"
          action={updateClientAction.bind(null, id)}
          defaultValues={{
            name: client.name,
            contactName: client.contactName,
            contactEmail: client.contactEmail,
            active: client.active,
          }}
        />
      </Card>

      <Card className="flex flex-col gap-4">
        <div>
          <h2 className="text-sm font-semibold">Assigned employees</h2>
          <p className="text-sm text-black/60 dark:text-white/60">
            Place an employee with this client. Rates can be adjusted later from
            the assignment.
          </p>
        </div>
        <ClientAssignments
          action={createAssignmentForClientAction.bind(null, id)}
          employees={employees}
          assignments={client.assignments.map((a) => ({
            id: a.id,
            employeeName: a.employee.name,
            projectName: a.projectName,
            payRate: a.payRate.toString(),
            billRate: a.billRate.toString(),
            startDate: a.startDate.toISOString(),
            active: a.active,
          }))}
        />
      </Card>
    </div>
  );
}
