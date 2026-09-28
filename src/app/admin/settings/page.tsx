import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { Badge, Button, PageHeader, Table, Td, Th } from "@/components/ui";
import { CompanySettingsForm } from "@/components/company-settings-form";
import { CutoffConfigForm } from "@/components/cutoff-config-form";
import { OnboardingInviteForm } from "@/components/onboarding-invite-form";
import { SettingsBox } from "@/components/admin/settings-box";
import { getCompanySettings } from "@/lib/company";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { formatMoneyPhp } from "@/lib/hr";
import {
  BuildingIcon,
  CalendarIcon,
  ClientsIcon,
  LogIcon,
  MailIcon,
  TeamIcon,
} from "@/components/ahora/icons";

export default async function SettingsPage() {
  await requireUser("ADMIN");

  const [
    settings,
    clients,
    assignments,
    latestContracts,
    cutoffConfig,
    managers,
    emailLogs,
  ] = await Promise.all([
    getCompanySettings(),
    prisma.client.findMany({ orderBy: { name: "asc" } }),
    prisma.assignment.findMany({
      include: { employee: true, client: true },
      orderBy: [{ active: "desc" }, { startDate: "desc" }],
    }),
    prisma.employeeContract.findMany({
      orderBy: { uploadedAt: "desc" },
      select: { employeeId: true, contractStart: true, contractEnd: true },
    }),
    prisma.cutoffConfig.findFirst(),
    prisma.user.findMany({
      where: { role: "MANAGER", active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.emailLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  // Most recent contract per employee (list is already newest-first).
  const contractByEmployee = new Map<
    string,
    { contractStart: Date | null; contractEnd: Date | null }
  >();
  for (const c of latestContracts) {
    if (!contractByEmployee.has(c.employeeId)) {
      contractByEmployee.set(c.employeeId, {
        contractStart: c.contractStart,
        contractEnd: c.contractEnd,
      });
    }
  }

  const cutoffParams = cutoffConfig?.params as
    | { payDelayDays?: number; periodLengthDays?: number }
    | null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Admin"
        description="Company details, clients, assignments, and system settings."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <SettingsBox
          icon={<BuildingIcon />}
          title="Company Information"
          subtitle="Name, addresses, bank details"
        >
          <div className="max-w-2xl">
            <CompanySettingsForm defaultValues={settings} />
          </div>
        </SettingsBox>

        <SettingsBox
          icon={<ClientsIcon />}
          title="Clients"
          subtitle={`${clients.length} client${clients.length === 1 ? "" : "s"}`}
        >
          <div className="flex flex-col gap-3">
            <div className="flex justify-end">
              <Link href="/admin/clients/new">
                <Button variant="secondary">New client</Button>
              </Link>
            </div>
            <Table>
              <thead>
                <tr>
                  <Th>Name</Th>
                  <Th>Contact</Th>
                  <Th>Status</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {clients.length === 0 && (
                  <tr>
                    <Td colSpan={4} className="text-black/50">
                      No clients yet.
                    </Td>
                  </tr>
                )}
                {clients.map((c) => (
                  <tr key={c.id} className="border-t border-black/5">
                    <Td>{c.name}</Td>
                    <Td>
                      {c.contactName || c.contactEmail
                        ? `${c.contactName ?? ""}${
                            c.contactName && c.contactEmail ? " · " : ""
                          }${c.contactEmail ?? ""}`
                        : "—"}
                    </Td>
                    <Td>
                      <Badge tone={c.active ? "green" : "neutral"}>
                        {c.active ? "Active" : "Inactive"}
                      </Badge>
                    </Td>
                    <Td>
                      <Link
                        href={`/admin/clients/${c.id}/edit`}
                        className="font-medium underline underline-offset-2"
                      >
                        Edit
                      </Link>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </SettingsBox>

        <SettingsBox
          icon={<TeamIcon />}
          title="Assignments"
          subtitle={`${assignments.length} assignment${assignments.length === 1 ? "" : "s"}`}
        >
          <div className="flex flex-col gap-3">
            <div className="flex justify-end">
              <Link href="/admin/assignments/new">
                <Button variant="secondary">New assignment</Button>
              </Link>
            </div>
            <Table>
              <thead>
                <tr>
                  <Th>Employee</Th>
                  <Th>Client / project</Th>
                  <Th>Pay rate</Th>
                  <Th>Bill rate</Th>
                  <Th>Start</Th>
                  <Th>Contract start</Th>
                  <Th>Contract end</Th>
                  <Th>Status</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {assignments.length === 0 && (
                  <tr>
                    <Td colSpan={9} className="text-black/50">
                      No assignments yet.
                    </Td>
                  </tr>
                )}
                {assignments.map((a) => {
                  const contract = contractByEmployee.get(a.employeeId);
                  return (
                    <tr key={a.id} className="border-t border-black/5">
                      <Td>{a.employee.name}</Td>
                      <Td>
                        {a.projectName
                          ? `${a.client.name} — ${a.projectName}`
                          : a.client.name}
                      </Td>
                      <Td>{formatMoneyPhp(a.payRate.toString())}</Td>
                      <Td>{formatCurrency(a.billRate.toString())}</Td>
                      <Td>{formatDate(a.startDate)}</Td>
                      <Td>
                        {contract?.contractStart
                          ? formatDate(contract.contractStart)
                          : "—"}
                      </Td>
                      <Td>
                        {contract?.contractEnd
                          ? formatDate(contract.contractEnd)
                          : "—"}
                      </Td>
                      <Td>
                        <Badge tone={a.active ? "green" : "neutral"}>
                          {a.active ? "Active" : "Inactive"}
                        </Badge>
                      </Td>
                      <Td>
                        <Link
                          href={`/admin/assignments/${a.id}/edit`}
                          className="font-medium underline underline-offset-2"
                        >
                          Edit
                        </Link>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        </SettingsBox>

        <SettingsBox
          icon={<CalendarIcon />}
          title="Cut-off Schedule"
          subtitle={cutoffConfig ? cutoffConfig.type.replace("_", " ") : "Not set"}
        >
          <div className="max-w-lg">
            <CutoffConfigForm
              defaultValues={
                cutoffConfig
                  ? {
                      type: cutoffConfig.type,
                      anchorDate: cutoffConfig.anchorDate,
                      payDelayDays: cutoffParams?.payDelayDays ?? 10,
                      periodLengthDays: cutoffParams?.periodLengthDays ?? 30,
                    }
                  : undefined
              }
            />
          </div>
        </SettingsBox>

        <SettingsBox
          icon={<MailIcon />}
          title="Onboarding Invites"
          subtitle="Send a sign-up link"
        >
          <OnboardingInviteForm managers={managers} />
        </SettingsBox>

        <SettingsBox
          icon={<LogIcon />}
          title="Email Log"
          subtitle={`Last ${emailLogs.length} sent`}
        >
          <Table>
            <thead>
              <tr>
                <Th>Sent</Th>
                <Th>Kind</Th>
                <Th>Recipient</Th>
                <Th>Subject</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {emailLogs.length === 0 && (
                <tr>
                  <Td colSpan={5} className="text-black/50">
                    No emails sent yet.
                  </Td>
                </tr>
              )}
              {emailLogs.map((log) => (
                <tr key={log.id} className="border-t border-black/5">
                  <Td>{formatDateTime(log.createdAt)}</Td>
                  <Td>{log.kind.replace(/_/g, " ")}</Td>
                  <Td>{log.recipientEmail}</Td>
                  <Td className="max-w-[16rem] truncate whitespace-nowrap">
                    {log.subject}
                  </Td>
                  <Td>
                    <Badge tone={log.status === "SENT" ? "green" : "red"}>
                      {log.status}
                    </Badge>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </SettingsBox>
      </div>
    </div>
  );
}
