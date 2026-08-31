import { formatDate } from "@/lib/format";
import { CuralinkLogo } from "@/components/curalink-logo";
import type { CompanySettings } from "@/lib/company";
import type { Payslip } from "@/lib/payslip";

function amount(n: number) {
  return new Intl.NumberFormat("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function PayslipDocument({
  company,
  payslip,
  periodLabel,
  dateProcessed,
  workingDaysMonth,
}: {
  company: CompanySettings;
  payslip: Payslip;
  periodLabel: string;
  dateProcessed: Date;
  workingDaysMonth: number;
}) {
  return (
    <div className="mx-auto max-w-2xl break-after-page bg-white p-4 text-black sm:p-8 print:max-w-none print:p-0">
      <div className="mb-6 text-center">
        {company.logoUrl ? (
          <img
            src={company.logoUrl}
            alt=""
            className="mx-auto mb-2 h-12 w-auto"
          />
        ) : (
          <CuralinkLogo className="mx-auto mb-2 h-16 w-16 text-black/70" />
        )}
        <h1 className="text-lg font-bold">{company.name}</h1>
        {company.payslipAddress && (
          <p className="mx-auto mt-1 max-w-lg text-[11px] leading-snug text-black/70">
            {company.payslipAddress}
          </p>
        )}
      </div>

      <div className="mb-4 text-sm">
        <p>
          <span className="font-semibold">Pay Period:</span> {periodLabel}
        </p>
        <p>
          <span className="font-semibold">Date Processed:</span>{" "}
          {formatDate(dateProcessed)}
        </p>
        <p>
          <span className="font-semibold">Total Working Days (Month):</span>{" "}
          {workingDaysMonth}
        </p>
      </div>

      <h2 className="mb-3 text-xl font-bold">{payslip.employeeName}</h2>

      <table className="mb-4 w-full border-collapse text-sm">
        <thead>
          <tr className="bg-black/[0.04]">
            <th className="border border-black/15 px-3 py-2 text-center font-semibold">
              Total Days
            </th>
            <th className="border border-black/15 px-3 py-2 text-center font-semibold">
              Days Present
            </th>
            <th className="border border-black/15 px-3 py-2 text-center font-semibold">
              Days Absent
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-black/15 px-3 py-2 text-center">
              {payslip.totalDays}
            </td>
            <td className="border border-black/15 px-3 py-2 text-center">
              {payslip.present}
            </td>
            <td className="border border-black/15 px-3 py-2 text-center">
              {payslip.absent}
            </td>
          </tr>
        </tbody>
      </table>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-black/[0.04]">
            <th className="border border-black/15 px-3 py-2 text-left font-semibold">
              Description
            </th>
            <th className="border border-black/15 px-3 py-2 text-right font-semibold">
              Amount ({payslip.currency})
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-black/15 px-3 py-2">Gross Pay</td>
            <td className="border border-black/15 px-3 py-2 text-right">
              {payslip.monthlySalary != null ? amount(payslip.grossPay) : "—"}
            </td>
          </tr>
          <tr>
            <td className="border border-black/15 px-3 py-2">Deductions</td>
            <td className="border border-black/15 px-3 py-2 text-right">
              {payslip.deductions > 0 ? amount(payslip.deductions) : "None"}
            </td>
          </tr>
          <tr className="bg-black/[0.04] font-semibold">
            <td className="border border-black/15 px-3 py-2">Net Pay</td>
            <td className="border border-black/15 px-3 py-2 text-right">
              {payslip.monthlySalary != null ? amount(payslip.netPay) : "—"}
            </td>
          </tr>
        </tbody>
      </table>

      <p className="mt-6 text-[11px] text-black/50">
        This is a system-generated payslip and does not require a signature.
      </p>
    </div>
  );
}
