import { formatCurrency, formatDate } from "@/lib/format";
import { CuralinkLogo } from "@/components/curalink-logo";
import type { CompanySettings } from "@/lib/company";
import type { ClientInvoiceLine } from "@/lib/types";
import type { InvoiceBreakdown } from "@/lib/invoicing";

function money(n: number, currency: string) {
  const abs = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(Math.abs(n));
  return n < 0 ? `(${abs})` : abs;
}

export function InvoiceDocument({
  company,
  invoice,
  breakdown,
}: {
  company: CompanySettings;
  invoice: {
    number: string;
    invoiceDate: Date;
    currency: string;
    billToName: string;
    billToAddress: string | null;
    lineItems: ClientInvoiceLine[];
    totalAmount: number;
  };
  breakdown: InvoiceBreakdown | null;
}) {
  const year = invoice.invoiceDate.getUTCFullYear();

  return (
    <div className="mx-auto max-w-3xl bg-white p-4 text-black sm:p-8 print:max-w-none print:p-0">
      <div className="mb-6 text-center">
        <h1 className="text-sm font-bold uppercase tracking-wide">
          {company.name}
        </h1>
        {company.registrationId && (
          <p className="text-[11px] text-black/70">
            Company Reg. ID: {company.registrationId}
          </p>
        )}
        {company.invoiceAddress && (
          <p className="mx-auto mt-0.5 max-w-xl text-[11px] leading-snug text-black/70">
            {company.invoiceAddress}
          </p>
        )}
      </div>

      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="mb-3 text-2xl font-semibold tracking-[0.3em] text-blue-900">
            INVOICE
          </p>
          <p className="text-sm">
            <span className="font-semibold">Invoice No:</span> {invoice.number}
          </p>
          <p className="text-sm">
            <span className="font-semibold">Date:</span>{" "}
            {formatDate(invoice.invoiceDate)}
          </p>
        </div>
        {company.logoUrl ? (
          <img src={company.logoUrl} alt="" className="h-14 w-auto" />
        ) : (
          <CuralinkLogo className="h-16 w-16 text-black/70" />
        )}
      </div>

      <div className="mb-6 text-sm">
        <p className="font-semibold text-blue-900">Bill To</p>
        <p className="font-semibold">{invoice.billToName}</p>
        {invoice.billToAddress && (
          <p className="whitespace-pre-line text-black/80">
            {invoice.billToAddress}
          </p>
        )}
      </div>

      <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="w-8 border border-black/20 px-2 py-1 text-left">#</th>
            <th className="border border-black/20 px-2 py-1 text-left">Item</th>
            <th className="border border-black/20 px-2 py-1 text-left">
              Coverage
            </th>
            <th className="border border-black/20 px-2 py-1 text-right">
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {invoice.lineItems.map((line, i) => (
            <tr key={i}>
              <td className="border border-black/20 px-2 py-1">{i + 1}</td>
              <td className="border border-black/20 px-2 py-1">
                {line.description}
              </td>
              <td className="border border-black/20 px-2 py-1">
                {line.coverage}
              </td>
              <td
                className={`border border-black/20 px-2 py-1 text-right tabular-nums ${
                  line.amount < 0 ? "text-red-600" : ""
                }`}
              >
                {money(line.amount, invoice.currency)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} className="px-2 py-2 text-right font-semibold">
              Total Amount
            </td>
            <td className="border border-black/40 px-2 py-2 text-right font-semibold tabular-nums">
              {money(invoice.totalAmount, invoice.currency)}
            </td>
          </tr>
        </tfoot>
      </table>
      </div>

      <div className="mt-8 text-sm">
        <p className="font-semibold text-blue-900">Payment Information</p>
        {company.bankAccountName && (
          <p>Account Name: {company.bankAccountName}</p>
        )}
        {company.bankAccountNumber && (
          <p>Account Number: {company.bankAccountNumber}</p>
        )}
        {company.bankName && <p>Bank: {company.bankName}</p>}
        {company.bankBranch && <p>Branch: {company.bankBranch}</p>}
        {company.bankAddress && <p>Bank Address: {company.bankAddress}</p>}
        {company.swiftCode && <p>SWIFT Code: {company.swiftCode}</p>}
      </div>

      <p className="mt-10 text-[11px] text-black/50">CONFIDENTIAL {year}</p>

      {breakdown && (
        <div className="mt-10 break-before-page">
          <div className="mb-4 text-center">
            <h2 className="text-sm font-bold uppercase tracking-wide">
              {company.name}
            </h2>
            {company.invoiceAddress && (
              <p className="mx-auto max-w-xl text-[11px] leading-snug text-black/70">
                {company.invoiceAddress}
              </p>
            )}
          </div>

          <h3 className="mb-1 text-base font-semibold">Breakdown</h3>

          <p className="mt-3 text-sm font-medium">Payroll Actuals</p>
          <div className="overflow-x-auto">
          <table className="mt-1 w-full border-collapse text-xs">
            <thead>
              <tr className="bg-black/[0.06]">
                <th className="border border-black/20 px-2 py-1 text-left">
                  Last Name
                </th>
                <th className="border border-black/20 px-2 py-1 text-left">
                  First Name
                </th>
                {breakdown.periodColumns.map((c) => (
                  <th
                    key={c.id}
                    className="border border-black/20 px-2 py-1 text-center"
                  >
                    {c.label}
                  </th>
                ))}
                <th className="border border-black/20 px-2 py-1 text-center">
                  Total Days
                </th>
                <th className="border border-black/20 px-2 py-1 text-center">
                  Max Days
                </th>
                <th className="border border-black/20 px-2 py-1 text-right">
                  Max Payout
                </th>
                <th className="border border-black/20 px-2 py-1 text-right">
                  Payout
                </th>
              </tr>
            </thead>
            <tbody>
              {breakdown.actuals.map((r) => (
                <tr key={r.employeeId}>
                  <td className="border border-black/20 px-2 py-1">
                    {r.lastName}
                  </td>
                  <td className="border border-black/20 px-2 py-1">
                    {r.firstName}
                  </td>
                  {breakdown.periodColumns.map((c) => (
                    <td
                      key={c.id}
                      className="border border-black/20 px-2 py-1 text-center"
                    >
                      {r.daysByPeriod[c.id] ?? 0}
                    </td>
                  ))}
                  <td className="border border-black/20 px-2 py-1 text-center">
                    {r.totalDays}
                  </td>
                  <td className="border border-black/20 px-2 py-1 text-center">
                    {breakdown.maxDays}
                  </td>
                  <td className="border border-black/20 px-2 py-1 text-right tabular-nums">
                    {formatCurrency(r.maxPayout)}
                  </td>
                  <td className="border border-black/20 px-2 py-1 text-right tabular-nums">
                    {formatCurrency(r.payout)}
                  </td>
                </tr>
              ))}
              <tr className="bg-black/[0.06] font-semibold">
                <td
                  className="border border-black/20 px-2 py-1"
                  colSpan={2 + breakdown.periodColumns.length + 2}
                >
                  Total
                </td>
                <td className="border border-black/20 px-2 py-1 text-right tabular-nums">
                  {formatCurrency(breakdown.actualsTotals.maxPayout)}
                </td>
                <td className="border border-black/20 px-2 py-1 text-right tabular-nums">
                  {formatCurrency(breakdown.actualsTotals.payout)}
                </td>
              </tr>
            </tbody>
          </table>
          </div>

          <p className="mt-5 text-sm font-medium">Payroll Projections</p>
          <div className="overflow-x-auto">
          <table className="mt-1 w-full border-collapse text-xs">
            <thead>
              <tr className="bg-black/[0.06]">
                <th className="border border-black/20 px-2 py-1 text-left">
                  Last Name
                </th>
                <th className="border border-black/20 px-2 py-1 text-left">
                  First Name
                </th>
                <th className="border border-black/20 px-2 py-1 text-right">
                  Basic Monthly Salary
                </th>
              </tr>
            </thead>
            <tbody>
              {breakdown.projections.map((r, i) => (
                <tr key={i}>
                  <td className="border border-black/20 px-2 py-1">
                    {r.lastName}
                  </td>
                  <td className="border border-black/20 px-2 py-1">
                    {r.firstName}
                  </td>
                  <td className="border border-black/20 px-2 py-1 text-right tabular-nums">
                    {formatCurrency(r.salary)}
                  </td>
                </tr>
              ))}
              <tr className="bg-black/[0.06] font-semibold">
                <td className="border border-black/20 px-2 py-1" colSpan={2}>
                  Total
                </td>
                <td className="border border-black/20 px-2 py-1 text-right tabular-nums">
                  {formatCurrency(breakdown.projectionsTotal)}
                </td>
              </tr>
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
