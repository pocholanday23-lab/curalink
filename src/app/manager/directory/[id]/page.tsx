import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { Badge, Button, PageHeader } from "@/components/ui";
import { ProfileView } from "@/components/profile-view";
import { USER_PROFILE_INCLUDE, toViewUser } from "@/lib/profile-mappers";
import { setEmployeeActiveAction } from "@/lib/actions/hr";

export default async function ManagerDirectoryProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const manager = await requireUser("MANAGER");
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: USER_PROFILE_INCLUDE,
  });
  if (!user || user.managerId !== manager.id) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={user.name}
        description={`@${user.username}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge tone={user.active ? "green" : "neutral"}>
              {user.active ? "Active" : "Inactive"}
            </Badge>
            <Link href={`/manager/directory/${user.id}/edit`}>
              <Button variant="secondary">Edit</Button>
            </Link>
            <form
              action={setEmployeeActiveAction.bind(null, user.id, !user.active)}
            >
              <Button
                type="submit"
                variant={user.active ? "danger" : "primary"}
              >
                {user.active ? "Deactivate" : "Activate"}
              </Button>
            </form>
          </div>
        }
      />
      <ProfileView user={toViewUser(user)} />
    </div>
  );
}
