import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { Badge, Button, Card, PageHeader } from "@/components/ui";
import { DirectoryTable, type DirectoryRow } from "@/components/directory-table";
import { BulkUploadDialog } from "@/components/bulk-upload-dialog";
import { DirectoryStatusFilter } from "@/components/directory-status-filter";
import { parseStatusFilter } from "@/lib/status-filter";
import { PendingInvitesList } from "@/components/pending-invites-list";
import { formatDate, formatDateTime } from "@/lib/format";

export default async function AdminEmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    created?: string;
    updated?: string;
    warnings?: string;
  }>;
}) {
  await requireUser("ADMIN");
  const sp = await searchParams;

  const employees = await prisma.user.findMany({
    include: { manager: true },
    orderBy: { name: "asc" },
  });

  const contracts = await prisma.employeeContract.findMany({
    orderBy: { uploadedAt: "desc" },
    select: {
      id: true,
      employeeId: true,
      fileName: true,
      uploadedAt: true,
      contractStart: true,
      contractEnd: true,
    },
  });
  const contractsByEmployeeId = new Map<
    string,
    DirectoryRow["contracts"]
  >();
  for (const c of contracts) {
    const list = contractsByEmployeeId.get(c.employeeId) ?? [];
    list.push({
      id: c.id,
      fileName: c.fileName,
      uploadedLabel: formatDateTime(c.uploadedAt),
      rangeLabel:
        c.contractStart || c.contractEnd
          ? `${c.contractStart ? formatDate(c.contractStart) : "?"} – ${
              c.contractEnd ? formatDate(c.contractEnd) : "?"
            }`
          : null,
    });
    contractsByEmployeeId.set(c.employeeId, list);
  }

  const status = parseStatusFilter(sp.status);
  const rows: DirectoryRow[] = employees
    .filter((e) =>
      status === "all" ? true : status === "active" ? e.active : !e.active
    )
    .map((e) => ({
      id: e.id,
      name: e.name,
      username: e.username,
      role: e.role,
      active: e.active,
      managerName: e.manager?.name ?? null,
      contracts: contractsByEmployeeId.get(e.id) ?? [],
    }));

  const managers = employees
    .filter((e) => e.role === "MANAGER" && e.active)
    .map((e) => ({ id: e.id, name: e.name }));

  const showImport = sp.created != null || sp.updated != null;
  const warningCount = Number(sp.warnings ?? 0);

  const pendingInvites = await prisma.onboardingInvite.findMany({
    where: { activatedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      manager: { select: { name: true } },
      invitedBy: { select: { name: true } },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Employees"
        description="Directory of all employee, manager, and admin records."
        actions={
          <>
            <BulkUploadDialog managers={managers} />
            <Link href="/admin/employees/new">
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
              {warningCount} warning{warningCount === 1 ? "" : "s"} — some cells
              could not be read
            </Badge>
          )}
        </Card>
      )}

      {pendingInvites.length > 0 && (
        <Card className="flex flex-col gap-3 p-0">
          <span className="px-4 pt-4 text-sm font-medium">Pending sign-ups</span>
          <PendingInvitesList
            reviewBasePath="/admin/employees"
            isAdmin
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
        <DirectoryTable
          rows={rows}
          basePath="/admin/employees"
          showImpersonate
          showContracts
        />
      </Card>
    </div>
  );
}
