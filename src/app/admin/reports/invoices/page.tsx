import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { Button, Card, PageHeader, Table, Td, Th } from "@/components/ui";
import { formatDate } from "@/lib/format";

export default async function InvoicesListPage() {
  await requireUser("ADMIN");

  const invoices = await prisma.clientInvoice.findMany({
    include: { client: true },
    orderBy: { invoiceDate: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Client invoices"
        description="Invoices issued to clients."
        actions={
          <Link href="/admin/reports/invoices/new">
            <Button>New invoice</Button>
          </Link>
        }
      />
      <Card className="p-0">
        <Table>
          <thead>
            <tr>
              <Th>Number</Th>
              <Th>Client</Th>
              <Th>Date</Th>
              <Th>Total</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 && (
              <tr>
                <Td colSpan={5} className="text-black/50">
                  No invoices yet.
                </Td>
              </tr>
            )}
            {invoices.map((inv) => (
              <tr
                key={inv.id}
                className="border-t border-black/5 dark:border-white/5"
              >
                <Td className="font-medium">{inv.number}</Td>
                <Td>{inv.client.name}</Td>
                <Td>{formatDate(inv.invoiceDate)}</Td>
                <Td>
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: inv.currency,
                  }).format(Number(inv.totalAmount))}
                </Td>
                <Td>
                  <Link
                    href={`/admin/reports/invoices/${inv.id}`}
                    className="font-medium underline underline-offset-2"
                  >
                    View
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
