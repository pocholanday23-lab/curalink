import { notFound } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { Card, PageHeader } from "@/components/ui";
import { ProfileForm } from "@/components/profile-form";
import { updateEmployeeWithProfileAction } from "@/lib/actions/hr";
import { USER_PROFILE_INCLUDE, toFormValues } from "@/lib/profile-mappers";

export default async function EditEmployeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireUser("ADMIN");

  const [employee, managers] = await Promise.all([
    prisma.user.findUnique({ where: { id }, include: USER_PROFILE_INCLUDE }),
    prisma.user.findMany({
      where: { role: "MANAGER", active: true, NOT: { id } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!employee) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={`Edit ${employee.name}`} description={`@${employee.username}`} />
      <Card>
        <ProfileForm
          mode="edit"
          action={updateEmployeeWithProfileAction.bind(null, id)}
          canEditAccount
          canEditPay
          managers={managers}
          defaultValues={toFormValues(employee)}
        />
      </Card>
    </div>
  );
}
