import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { Button, Card, Field, Input, PageHeader, Select } from "@/components/ui";
import { InvoiceForm } from "@/components/invoice-form";
import { createInvoiceAction } from "@/lib/actions/invoices";
import {
  cycleLabel,
  defaultBilledCycle,
  nextInvoiceNumber,
  suggestInvoiceLines,
} from "@/lib/invoicing";
import { getCompanySettings } from "@/lib/company";
import { formatDate } from "@/lib/format";

function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{
    billedFrom?: string;
    billedTo?: string;
    previousInvoiceId?: string;
  }>;
}) {
  await requireUser("ADMIN");
  const sp = await searchParams;

  const def = defaultBilledCycle();
  const billedFromStr = sp.billedFrom || toISO(def.from);
  const billedToStr = sp.billedTo || toISO(def.to);
  const billedFrom = new Date(billedFromStr);
  const billedTo = new Date(billedToStr);

  const [clients, prevInvoices, number, company] = await Promise.all([
    prisma.client.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.clientInvoice.findMany({
      orderBy: { invoiceDate: "desc" },
      take: 20,
      select: { id: true, number: true, invoiceDate: true },
    }),
    nextInvoiceNumber(),
    getCompanySettings(),
  ]);

  const previousInvoiceId =
    sp.previousInvoiceId && prevInvoices.some((i) => i.id === sp.previousInvoiceId)
      ? sp.previousInvoiceId
      : "";

  const loaded = sp.billedFrom != null; // "Load suggested lines" was clicked
  const suggestion = loaded
    ? await suggestInvoiceLines({ billedFrom, billedTo, previousInvoiceId: previousInvoiceId || null })
    : { lines: [], warnings: [] };

  const billedLabel = cycleLabel(billedFrom, billedTo);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="New invoice"
        description="Set the cost-of-salary cycle and previous invoice, load the suggested lines, then edit as needed."
      />

      <Card className="flex flex-col gap-3">
        <span className="text-sm font-medium">Load suggested lines</span>
        <form
          method="get"
          className="flex flex-wrap items-end gap-3 text-sm"
        >
          <Field label="Cost of salary — from" htmlFor="billedFrom">
            <Input
              id="billedFrom"
              name="billedFrom"
              type="date"
              defaultValue={billedFromStr}
            />
          </Field>
          <Field label="to" htmlFor="billedTo">
            <Input
              id="billedTo"
              name="billedTo"
              type="date"
              defaultValue={billedToStr}
            />
          </Field>
          <Field label="Previous invoice (for the advance already paid)" htmlFor="previousInvoiceId">
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
            Load suggested lines
          </Button>
        </form>
        <p className="text-xs opacity-60">
          Line 2 prorates each active person&apos;s monthly USD rate by present ÷
          (present + absent) days over that cycle. Line 3 sums the monthly USD
          rate of every active person for the next cycle. Line 4 is{" "}
          {company.serviceChargePct}% of line 3 (change under Settings). Line 1 is
          taken from the previous invoice&apos;s &ldquo;Advance Salary&rdquo; line.
        </p>
      </Card>

      {loaded && suggestion.warnings.length > 0 && (
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
          mode="create"
          action={createInvoiceAction}
          clients={clients}
          defaultValues={{
            number,
            clientId: clients[0]?.id ?? "",
            invoiceDate: toISO(new Date()),
            currency: "USD",
            billToName: "",
            billToAddress: "",
            coverageNote: "",
            notes: "",
            billedFrom: billedFromStr,
            billedTo: billedToStr,
            previousInvoiceId,
            billedLabel,
            lines: suggestion.lines,
          }}
        />
      </Card>
    </div>
  );
}
