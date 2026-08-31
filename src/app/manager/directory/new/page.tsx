import { requireUser } from "@/lib/dal";
import { Card, PageHeader } from "@/components/ui";
import { ProfileForm } from "@/components/profile-form";
import { createEmployeeWithProfileAction } from "@/lib/actions/hr";

export default async function ManagerNewEmployeePage() {
  await requireUser("MANAGER");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="New employee"
        description="Create an account and HR record. The new hire reports to you and gets the default password."
      />
      <Card>
        <ProfileForm mode="create" action={createEmployeeWithProfileAction} />
      </Card>
    </div>
  );
}
