import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { Badge, Button, Card, PageHeader, Table, Td, Th } from "@/components/ui";
import { CompanySettingsForm } from "@/components/company-settings-form";
import { getCompanySettings } from "@/lib/company";
import { formatCurrency, formatDate } from "@/lib/format";

export default async function SettingsPage() {
  await requireUser("ADMIN");

  const [settings, clients, assignments] = await Promise.all([
    getCompanySettings(),
    prisma.client.findMany({ orderBy: { name: "asc" } }),
    prisma.assignment.findMany({
      include: { employee: true, client: true },
      orderBy: [{ active: "desc" }, { startDate: "desc" }],
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Settings"
        description="Company details, clients, and employee assignments."
      />

      <Card>
        <h2 className="mb-4 text-sm font-semibold">Company</h2>
        <div className="max-w-2xl">
          <CompanySettingsForm defaultValues={settings} />
        </div>
      </Card>

      <Card className="p-0">
        <div className="flex items-center justify-between border-b border-black/10 px-4 py-3 dark:border-white/10">
          <h2 className="text-sm font-semibold">Clients</h2>
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
              <tr
                key={c.id}
                className="border-t border-black/5 dark:border-white/5"
              >
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
      </Card>

      <Card className="p-0">
        <div className="flex items-center justify-between border-b border-black/10 px-4 py-3 dark:border-white/10">
          <h2 className="text-sm font-semibold">Assignments</h2>
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
              <Th>Status</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {assignments.length === 0 && (
              <tr>
                <Td colSpan={7} className="text-black/50">
                  No assignments yet.
                </Td>
              </tr>
            )}
            {assignments.map((a) => (
              <tr
                key={a.id}
                className="border-t border-black/5 dark:border-white/5"
              >
                <Td>{a.employee.name}</Td>
                <Td>
                  {a.projectName
                    ? `${a.client.name} — ${a.projectName}`
                    : a.client.name}
                </Td>
                <Td>{formatCurrency(a.payRate.toString())}</Td>
                <Td>{formatCurrency(a.billRate.toString())}</Td>
                <Td>{formatDate(a.startDate)}</Td>
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
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
