import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { Card, PageHeader } from "@/components/ui";
import { InvoiceForm } from "@/components/invoice-form";
import { createInvoiceAction } from "@/lib/actions/invoices";
import { nextInvoiceNumber, suggestInvoiceLines } from "@/lib/invoicing";
import { getCompanySettings } from "@/lib/company";
import { formatDateRange } from "@/lib/format";

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ payPeriodId?: string | string[] }>;
}) {
  await requireUser("ADMIN");
  const sp = await searchParams;
  const selectedPeriodIds = (
    Array.isArray(sp.payPeriodId)
      ? sp.payPeriodId
      : sp.payPeriodId
        ? [sp.payPeriodId]
        : []
  ).filter(Boolean);

  const [clients, closedPeriods, number, company] = await Promise.all([
    prisma.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.payPeriod.findMany({
      where: { status: "CLOSED" },
      orderBy: { startDate: "desc" },
    }),
    nextInvoiceNumber(),
    getCompanySettings(),
  ]);

  const validSelected = selectedPeriodIds.filter((id) =>
    closedPeriods.some((p) => p.id === id)
  );

  const suggestedLines =
    validSelected.length > 0
      ? await suggestInvoiceLines({ payPeriodIds: validSelected })
      : [];

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="New invoice"
        description="Pick closed periods to pre-fill the computable lines, then edit as needed."
      />

      <Card className="flex flex-col gap-3">
        <span className="text-sm font-medium">
          Roll up payroll actuals from closed periods
        </span>
        <form method="get" className="flex flex-col gap-2 text-sm">
          {closedPeriods.length === 0 && (
            <p className="text-black/50 dark:text-white/50">
              No closed pay periods yet.
            </p>
          )}
          {closedPeriods.map((p) => (
            <label key={p.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                name="payPeriodId"
                value={p.id}
                defaultChecked={validSelected.includes(p.id)}
              />
              {formatDateRange(p.startDate, p.endDate)}
            </label>
          ))}
          <div>
            <button
              type="submit"
              className="mt-1 rounded-md border border-black/15 px-3 py-1.5 font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
            >
              Load suggested lines
            </button>
          </div>
        </form>
        <p className="text-xs text-black/50 dark:text-white/50">
          Service charge uses {company.serviceChargePct}% (change under Company
          settings). Add the negative &quot;Advance Salary (Paid)&quot; and any
          per-employee adjustments by hand.
        </p>
      </Card>

      <Card>
        <InvoiceForm
          mode="create"
          action={createInvoiceAction}
          clients={clients}
          defaultValues={{
            number,
            clientId: clients[0]?.id ?? "",
            invoiceDate: today,
            currency: "USD",
            billToName: "",
            billToAddress: "",
            coverageNote: "",
            notes: "",
            payPeriodIds: validSelected,
            lines: suggestedLines,
          }}
        />
      </Card>
    </div>
  );
}
