import { notFound } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { Card, PageHeader } from "@/components/ui";
import { InvoiceForm } from "@/components/invoice-form";
import { updateInvoiceAction } from "@/lib/actions/invoices";
import type { ClientInvoiceLine } from "@/lib/types";

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireUser("ADMIN");

  const [invoice, clients] = await Promise.all([
    prisma.clientInvoice.findUnique({ where: { id } }),
    prisma.client.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  if (!invoice) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={`Edit invoice ${invoice.number}`} />
      <Card>
        <InvoiceForm
          mode="edit"
          action={updateInvoiceAction.bind(null, id)}
          clients={clients}
          defaultValues={{
            number: invoice.number,
            clientId: invoice.clientId,
            invoiceDate: invoice.invoiceDate.toISOString().slice(0, 10),
            currency: invoice.currency,
            billToName: invoice.billToName,
            billToAddress: invoice.billToAddress ?? "",
            coverageNote: invoice.coverageNote ?? "",
            notes: invoice.notes ?? "",
            payPeriodIds: invoice.payPeriodIds,
            lines: invoice.lineItems as unknown as ClientInvoiceLine[],
          }}
        />
      </Card>
    </div>
  );
}
