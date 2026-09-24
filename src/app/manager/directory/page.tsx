import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { Badge, Button, Card, PageHeader } from "@/components/ui";
import { DirectoryTable, type DirectoryRow } from "@/components/directory-table";
import { BulkUploadDialog } from "@/components/bulk-upload-dialog";
import { DirectoryStatusFilter } from "@/components/directory-status-filter";
import { parseStatusFilter } from "@/lib/status-filter";
import { PendingInvitesList } from "@/components/pending-invites-list";

export default async function ManagerDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    created?: string;
    updated?: string;
    warnings?: string;
  }>;
}) {
  const manager = await requireUser("MANAGER");
  const sp = await searchParams;

  const status = parseStatusFilter(sp.status);
  const reports = await prisma.user.findMany({
    where: {
      managerId: manager.id,
      ...(status === "all" ? {} : { active: status === "active" }),
    },
    orderBy: { name: "asc" },
  });

  const rows: DirectoryRow[] = reports.map((e) => ({
    id: e.id,
    name: e.name,
    username: e.username,
    role: e.role,
    active: e.active,
    managerName: manager.name ?? null,
  }));

  const showImport = sp.created != null || sp.updated != null;
  const warningCount = Number(sp.warnings ?? 0);

  const pendingInvites = await prisma.onboardingInvite.findMany({
    where: {
      activatedAt: null,
      OR: [{ invitedById: manager.id }, { managerId: manager.id }],
    },
    orderBy: { createdAt: "desc" },
    include: {
      manager: { select: { name: true } },
      invitedBy: { select: { name: true } },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Directory"
        description="The people who report to you and the details on file for them."
        actions={
          <>
            <BulkUploadDialog />
            <Link href="/manager/directory/new">
              <Button>New employee</Button>
            </Link>
          </>
        }
      />

      {showImport && (
        <Card className="flex flex-wrap items-center gap-2 text-sm">
          <Badge tone="green">{sp.created ?? 0} created</Badge>
          <Badge>{sp.updated ?? 0} updated</Badge>
          {warningCount > 0 && (
            <Badge tone="amber">
              {warningCount} warning{warningCount === 1 ? "" : "s"}
            </Badge>
          )}
        </Card>
      )}

      {pendingInvites.length > 0 && (
        <Card className="flex flex-col gap-3 p-0">
          <span className="px-4 pt-4 text-sm font-medium">Pending sign-ups</span>
          <PendingInvitesList
            reviewBasePath="/manager/directory"
            canConfirm={false}
            rows={pendingInvites.map((i) => ({
              id: i.id,
              email: i.email,
              managerName: i.manager?.name ?? null,
              invitedByName: i.invitedBy.name,
              createdAt: i.createdAt,
              expiresAt: i.expiresAt,
              completedAt: i.completedAt,
              confirmedAt: i.confirmedAt,
            }))}
          />
        </Card>
      )}

      <Card className="p-0">
        <DirectoryStatusFilter value={status} />
        <DirectoryTable rows={rows} basePath="/manager/directory" />
      </Card>
    </div>
  );
}
