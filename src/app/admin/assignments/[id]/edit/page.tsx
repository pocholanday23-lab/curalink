import { notFound } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { Card, PageHeader } from "@/components/ui";
import { AssignmentForm } from "@/components/assignment-form";
import { updateAssignmentAction } from "@/lib/actions/assignments";

export default async function EditAssignmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireUser("ADMIN");

  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: { employee: true, client: true },
  });
  if (!assignment) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Edit assignment — ${assignment.employee.name} / ${assignment.client.name}`}
      />
      <Card className="max-w-lg">
        <AssignmentForm
          mode="edit"
          action={updateAssignmentAction.bind(null, id)}
          employees={[]}
          clients={[]}
          defaultValues={{
            employeeName: assignment.employee.name,
            clientName: assignment.client.name,
            projectName: assignment.projectName,
            payRate: assignment.payRate.toString(),
            billRate: assignment.billRate.toString(),
            startDate: assignment.startDate,
            endDate: assignment.endDate,
            active: assignment.active,
          }}
        />
      </Card>
    </div>
  );
}
