import { notFound } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { Card, PageHeader } from "@/components/ui";
import { ProfileForm } from "@/components/profile-form";
import { updateEmployeeWithProfileAction } from "@/lib/actions/hr";
import { USER_PROFILE_INCLUDE, toFormValues } from "@/lib/profile-mappers";
import { ContractManager, type EditableContract } from "@/components/admin/contract-manager";
import { formatDateTime } from "@/lib/format";

export default async function EditEmployeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireUser("ADMIN");

  const [employee, managers, clients, contracts] = await Promise.all([
    prisma.user.findUnique({ where: { id }, include: USER_PROFILE_INCLUDE }),
    prisma.user.findMany({
      where: { role: "MANAGER", active: true, NOT: { id } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.employeeContract.findMany({
      where: { employeeId: id },
      orderBy: { uploadedAt: "desc" },
    }),
  ]);

  if (!employee) notFound();

  const editableContracts: EditableContract[] = contracts.map((c) => ({
    id: c.id,
    fileName: c.fileName,
    uploadedLabel: formatDateTime(c.uploadedAt),
    clientId: c.clientId ?? "",
    billRatePhp: c.billRatePhp?.toString() ?? "",
    contractStart: c.contractStart ? c.contractStart.toISOString().slice(0, 10) : "",
    contractEnd: c.contractEnd ? c.contractEnd.toISOString().slice(0, 10) : "",
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={`Edit ${employee.name}`} description={`@${employee.username}`} />
      <Card>
        <h2 className="mb-4 text-sm font-semibold">Contract</h2>
        <ContractManager employeeId={id} contracts={editableContracts} clients={clients} />
      </Card>
      <Card>
        <ProfileForm
          mode="edit"
          action={updateEmployeeWithProfileAction.bind(null, id)}
          canEditAccount
          canEditPay
          managers={managers}
          defaultValues={toFormValues(employee)}
        />
      </Card>
    </div>
  );
}
