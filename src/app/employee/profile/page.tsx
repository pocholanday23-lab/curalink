import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { AhoraProfileView } from "@/components/ahora/profile-view";
import { USER_PROFILE_INCLUDE, toViewUser } from "@/lib/profile-mappers";

export default async function MyProfilePage() {
  const sessionUser = await requireUser("EMPLOYEE", "MANAGER", "ADMIN");

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: sessionUser.id },
    include: USER_PROFILE_INCLUDE,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <Link
          href="/employee/profile/edit"
          className="rounded-md bg-[var(--ahora-chrome)] px-4 py-2 text-sm font-medium text-white hover:bg-[#163d24]"
        >
          Edit my info
        </Link>
      </div>
      <AhoraProfileView user={toViewUser(user)} />
    </div>
  );
}
