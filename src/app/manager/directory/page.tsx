import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { Badge, Button, Card, PageHeader } from "@/components/ui";
import { DirectoryTable, type DirectoryRow } from "@/components/directory-table";
import { EmployeeUploadForm } from "@/components/employee-upload-form";

export default async function ManagerDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    created?: string;
    updated?: string;
    warnings?: string;
  }>;
}) {
  const manager = await requireUser("MANAGER");
  const sp = await searchParams;

  const reports = await prisma.user.findMany({
    where: { managerId: manager.id },
    include: {
      profile: {
        select: { contactNumber: true, salaryPhp: true },
      },
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
    contactNumber: e.profile?.contactNumber ?? null,
    salaryPhp: e.profile?.salaryPhp?.toString() ?? null,
  }));

  const showImport = sp.created != null || sp.updated != null;
  const warningCount = Number(sp.warnings ?? 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Directory"
        description="The people who report to you and the details on file for them."
        actions={
          <Link href="/manager/directory/new">
            <Button>New employee</Button>
          </Link>
        }
      />

      <Card className="flex flex-col gap-4">
        <span className="text-sm font-medium">Bulk upload from Excel</span>
        <EmployeeUploadForm />
      </Card>

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

      <Card className="p-0">
        <DirectoryTable
          rows={rows}
          basePath="/manager/directory"
          showPay
        />
      </Card>
    </div>
  );
}
