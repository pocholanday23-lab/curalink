import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { Button, PageHeader } from "@/components/ui";
import { ProfileView } from "@/components/profile-view";
import { USER_PROFILE_INCLUDE, toViewUser } from "@/lib/profile-mappers";

export default async function MyProfilePage() {
  const sessionUser = await requireUser("EMPLOYEE", "MANAGER", "ADMIN");

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: sessionUser.id },
    include: USER_PROFILE_INCLUDE,
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="My information"
        description="The details HR and payroll hold for you."
        actions={
          <Link href="/employee/profile/edit">
            <Button>Edit my info</Button>
          </Link>
        }
      />
      <ProfileView user={toViewUser(user)} />
    </div>
  );
}
