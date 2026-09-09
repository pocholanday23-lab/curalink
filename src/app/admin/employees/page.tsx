import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { Badge, Button, Card, PageHeader } from "@/components/ui";
import { DirectoryTable, type DirectoryRow } from "@/components/directory-table";
import { EmployeeUploadForm } from "@/components/employee-upload-form";
import { SendInvitesButton } from "@/components/send-invites-button";

export default async function AdminEmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{
    created?: string;
    updated?: string;
    warnings?: string;
  }>;
}) {
  await requireUser("ADMIN");
  const sp = await searchParams;

  const employees = await prisma.user.findMany({
    include: { manager: true, profile: { select: { contactNumber: true, salaryPhp: true } } },
    orderBy: { name: "asc" },
  });

  const rows: DirectoryRow[] = employees.map((e) => ({
    id: e.id,
    name: e.name,
    username: e.username,
    role: e.role,
    active: e.active,
    managerName: e.manager?.name ?? null,
    contactNumber: e.profile?.contactNumber ?? null,
    salaryPhp: e.profile?.salaryPhp?.toString() ?? null,
  }));

  const managers = employees
    .filter((e) => e.role === "MANAGER" && e.active)
    .map((e) => ({ id: e.id, name: e.name }));

  const showImport = sp.created != null || sp.updated != null;
  const warningCount = Number(sp.warnings ?? 0);

  const inviteCount = employees.filter(
    (e) =>
      e.active &&
      (e.role === "EMPLOYEE" || e.role === "MANAGER") &&
      e.email.includes("@")
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Employees"
        description="Directory of all employee, manager, and admin records."
        actions={
          <Link href="/admin/employees/new">
            <Button>New employee</Button>
          </Link>
        }
      />

      <Card className="flex flex-col gap-4">
        <span className="text-sm font-medium">Bulk upload from Excel</span>
        <EmployeeUploadForm managers={managers} />
      </Card>

      <Card className="flex flex-col gap-3">
        <span className="text-sm font-medium">Account invites</span>
        <p className="text-xs opacity-70">
          Emails every active employee and manager that an account exists for
          them and invites them to sign in. People who have not logged in yet
          get their username and default password; everyone else gets their
          username only.
        </p>
        <SendInvitesButton count={inviteCount} />
      </Card>

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

      <Card className="p-0">
        <DirectoryTable
          rows={rows}
          basePath="/admin/employees"
          showImpersonate
        />
      </Card>
    </div>
  );
}
