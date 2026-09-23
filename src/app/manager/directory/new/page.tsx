import { requireUser } from "@/lib/dal";
import { Card, PageHeader } from "@/components/ui";
import { ProfileForm } from "@/components/profile-form";
import { OnboardingInviteForm } from "@/components/onboarding-invite-form";
import { createEmployeeWithProfileAction } from "@/lib/actions/hr";

export default async function ManagerNewEmployeePage() {
  await requireUser("MANAGER");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="New employee"
        description="Create an account and HR record. The new hire reports to you and gets the default password."
      />

      <Card className="flex flex-col gap-3">
        <span className="text-sm font-medium">Send a sign-up link</span>
        <OnboardingInviteForm />
      </Card>

      <div className="flex items-center gap-3 text-xs uppercase tracking-wide opacity-50">
        <span className="h-px flex-1 bg-current" />
        or create it yourself
        <span className="h-px flex-1 bg-current" />
      </div>

      <Card>
        <ProfileForm mode="create" action={createEmployeeWithProfileAction} />
      </Card>
    </div>
  );
}
