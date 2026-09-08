import { notFound } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { Button, Card, Field, Input, PageHeader, Select } from "@/components/ui";
import { InvoiceForm } from "@/components/invoice-form";
import { updateInvoiceAction } from "@/lib/actions/invoices";
import { cycleLabel, suggestInvoiceLines } from "@/lib/invoicing";
import { formatDate } from "@/lib/format";
import type { ClientInvoiceLine } from "@/lib/types";

function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function EditInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    billedFrom?: string;
    billedTo?: string;
    previousInvoiceId?: string;
    recompute?: string;
  }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  await requireUser("ADMIN");

  const [invoice, clients, prevInvoices] = await Promise.all([
    prisma.clientInvoice.findUnique({ where: { id } }),
    prisma.client.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.clientInvoice.findMany({
      where: { id: { not: id } },
      orderBy: { invoiceDate: "desc" },
      take: 20,
      select: { id: true, number: true, invoiceDate: true },
    }),
  ]);
  if (!invoice) notFound();

  const billedFromStr =
    sp.billedFrom ||
    (invoice.billedFrom ? toISO(invoice.billedFrom) : "");
  const billedToStr =
    sp.billedTo || (invoice.billedTo ? toISO(invoice.billedTo) : "");
  const previousInvoiceId =
    sp.previousInvoiceId ?? invoice.previousInvoiceId ?? "";

  const recompute = sp.recompute != null && billedFromStr && billedToStr;
  const suggestion = recompute
    ? await suggestInvoiceLines({
        billedFrom: new Date(billedFromStr),
        billedTo: new Date(billedToStr),
        previousInvoiceId: previousInvoiceId || null,
      })
    : null;

  const lines = suggestion
    ? suggestion.lines
    : (invoice.lineItems as unknown as ClientInvoiceLine[]);

  const billedLabel =
    billedFromStr && billedToStr
      ? cycleLabel(new Date(billedFromStr), new Date(billedToStr))
      : "";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={`Edit invoice ${invoice.number}`} />

      <Card className="flex flex-col gap-3">
        <span className="text-sm font-medium">
          Recompute the suggested lines (optional)
        </span>
        <form method="get" className="flex flex-wrap items-end gap-3 text-sm">
          <input type="hidden" name="recompute" value="1" />
          <Field label="Cost of salary — from" htmlFor="billedFrom">
            <Input id="billedFrom" name="billedFrom" type="date" defaultValue={billedFromStr} />
          </Field>
          <Field label="to" htmlFor="billedTo">
            <Input id="billedTo" name="billedTo" type="date" defaultValue={billedToStr} />
          </Field>
          <Field label="Previous invoice" htmlFor="previousInvoiceId">
            <Select
              id="previousInvoiceId"
              name="previousInvoiceId"
              defaultValue={previousInvoiceId}
            >
              <option value="">— none —</option>
              {prevInvoices.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.number} ({formatDate(i.invoiceDate)})
                </option>
              ))}
            </Select>
          </Field>
          <Button type="submit" variant="secondary">
            Recompute
          </Button>
        </form>
        <p className="text-xs opacity-60">
          Recomputing replaces the line items below with fresh values. Any manual
          lines you added will need to be re-added.
        </p>
      </Card>

      {suggestion && suggestion.warnings.length > 0 && (
        <Card className="flex flex-col gap-1 text-sm">
          {suggestion.warnings.map((w, i) => (
            <p key={i} className="text-amber-700 dark:text-amber-400">
              {w}
            </p>
          ))}
        </Card>
      )}

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
            billedFrom: billedFromStr,
            billedTo: billedToStr,
            previousInvoiceId,
            billedLabel,
            lines,
          }}
        />
      </Card>
    </div>
  );
}
