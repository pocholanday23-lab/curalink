import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { Card, PageHeader } from "@/components/ui";
import { AssignmentForm } from "@/components/assignment-form";
import { createAssignmentAction } from "@/lib/actions/assignments";

export default async function NewAssignmentPage() {
  await requireUser("ADMIN");

  const [employees, clients] = await Promise.all([
    prisma.user.findMany({
      where: { role: "EMPLOYEE", active: true },
      orderBy: { name: "asc" },
    }),
    prisma.client.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="New assignment" />
      <Card className="max-w-lg">
        <AssignmentForm
          mode="create"
          action={createAssignmentAction}
          employees={employees}
          clients={clients}
        />
      </Card>
    </div>
  );
}
