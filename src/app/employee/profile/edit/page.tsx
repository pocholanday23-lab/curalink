import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { Card, PageHeader } from "@/components/ui";
import { SelfProfileForm } from "@/components/self-profile-form";
import { saveOwnProfileAction } from "@/lib/actions/hr";
import { USER_PROFILE_INCLUDE } from "@/lib/profile-mappers";
import { formatDate } from "@/lib/format";
import { formatMoneyPhp } from "@/lib/hr";

export default async function EditMyProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const sessionUser = await requireUser("EMPLOYEE", "MANAGER", "ADMIN");
  const { welcome } = await searchParams;

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: sessionUser.id },
    include: USER_PROFILE_INCLUDE,
  });
  const p = user.profile;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={welcome ? "Welcome — a few details from you" : "Edit my info"}
        description={
          welcome
            ? "Add your contact and emergency details. Your manager or an admin fills in the rest."
            : "Your full record. You can change the email, contact number, emergency contact, and dependents."
        }
      />
      <Card>
        <SelfProfileForm
          action={saveOwnProfileAction}
          defaultValues={{
            firstName: user.firstName ?? "",
            middleName: p?.middleName ?? "",
            lastName: user.lastName ?? "",
            email: user.email,
            username: user.username,
            role: user.role,
            managerName: user.manager?.name ?? "—",
            monthlySalary:
              p?.salaryPhp != null
                ? formatMoneyPhp(p.salaryPhp.toString())
                : "—",
            birthDate: p?.birthDate ? formatDate(p.birthDate) : "",
            maritalStatus: p?.maritalStatus ?? "",
            spouseName: p?.spouseName ?? "",
            contactNumber: p?.contactNumber ?? "",
            homeAddress: p?.homeAddress ?? "",
            sssNo: p?.sssNo ?? "",
            tinNo: p?.tinNo ?? "",
            pagibigNo: p?.pagibigNo ?? "",
            bankName: p?.bankName ?? "",
            bankBranch: p?.bankBranch ?? "",
            bankAccountName: p?.bankAccountName ?? "",
            bankAccountNumber: p?.bankAccountNumber ?? "",
            bankType: p?.bankType ?? "",
            emergencyContactName: p?.emergencyContactName ?? "",
            emergencyContactNumber: p?.emergencyContactNumber ?? "",
            dependents:
              p?.dependents.map((d) => ({
                name: d.name,
                birthDate: d.birthDate ?? "",
              })) ?? [],
          }}
        />
      </Card>
    </div>
  );
}
