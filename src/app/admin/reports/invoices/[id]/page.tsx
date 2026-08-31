import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { Button, Card } from "@/components/ui";
import { PrintButton } from "@/components/print-button";
import { InvoiceDocument } from "@/components/invoice-document";
import { getCompanySettings } from "@/lib/company";
import { computeInvoiceBreakdown } from "@/lib/invoicing";
import { deleteInvoiceAction } from "@/lib/actions/invoices";
import type { ClientInvoiceLine } from "@/lib/types";

export default async function InvoiceViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireUser("ADMIN");

  const invoice = await prisma.clientInvoice.findUnique({ where: { id } });
  if (!invoice) notFound();

  const [company, breakdown] = await Promise.all([
    getCompanySettings(),
    computeInvoiceBreakdown(invoice.payPeriodIds),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <h1 className="text-2xl font-semibold tracking-tight">
          Invoice {invoice.number}
        </h1>
        <div className="flex gap-2">
          <Link href={`/admin/reports/invoices/${invoice.id}/edit`}>
            <Button variant="secondary">Edit</Button>
          </Link>
          <PrintButton />
          <form action={deleteInvoiceAction.bind(null, invoice.id)}>
            <Button type="submit" variant="danger">
              Delete
            </Button>
          </form>
        </div>
      </div>

      <Card className="print:border-0 print:p-0 print:shadow-none">
        <InvoiceDocument
          company={company}
          invoice={{
            number: invoice.number,
            invoiceDate: invoice.invoiceDate,
            currency: invoice.currency,
            billToName: invoice.billToName,
            billToAddress: invoice.billToAddress,
            lineItems: invoice.lineItems as unknown as ClientInvoiceLine[],
            totalAmount: Number(invoice.totalAmount),
          }}
          breakdown={breakdown}
        />
      </Card>
    </div>
  );
}
