import { notFound } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { Card, PageHeader } from "@/components/ui";
import { ProfileForm } from "@/components/profile-form";
import { updateEmployeeWithProfileAction } from "@/lib/actions/hr";
import { USER_PROFILE_INCLUDE, toFormValues } from "@/lib/profile-mappers";

export default async function ManagerEditEmployeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const manager = await requireUser("MANAGER");
  const { id } = await params;

  const employee = await prisma.user.findUnique({
    where: { id },
    include: USER_PROFILE_INCLUDE,
  });
  if (!employee || employee.managerId !== manager.id) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Edit ${employee.name}`}
        description={`@${employee.username} · salary is managed by an admin`}
      />
      <Card>
        <ProfileForm
          mode="edit"
          action={updateEmployeeWithProfileAction.bind(null, id)}
          defaultValues={toFormValues(employee)}
        />
      </Card>
    </div>
  );
}
