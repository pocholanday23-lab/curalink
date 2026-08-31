import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { Card, PageHeader } from "@/components/ui";
import { ProfileForm } from "@/components/profile-form";
import { createEmployeeWithProfileAction } from "@/lib/actions/hr";

export default async function NewEmployeePage() {
  await requireUser("ADMIN");

  const managers = await prisma.user.findMany({
    where: { role: "MANAGER", active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="New employee"
        description="Create an account and HR record. The username and default password are assigned automatically."
      />
      <Card>
        <ProfileForm
          mode="create"
          action={createEmployeeWithProfileAction}
          canEditAccount
          canEditPay
          managers={managers}
        />
      </Card>
    </div>
  );
}
