import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { AhoraCard, AhoraTable, AhoraTd, AhoraTh } from "@/components/ahora/ui";
import { formatDate, formatDateRange } from "@/lib/format";
import { computePayslipsForPeriod } from "@/lib/payslip";

function php(n: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(n);
}

export default async function EmployeePayslipsPage() {
  const user = await requireUser("EMPLOYEE", "MANAGER");

  const periods = await prisma.payPeriod.findMany({
    where: { status: "CLOSED" },
    orderBy: { startDate: "desc" },
  });

  const rows = await Promise.all(
    periods.map(async (p) => {
      const batch = await computePayslipsForPeriod(p.id);
      const mine = batch.payslips.find((s) => s.employeeId === user.id);
      return { period: p, payslip: mine };
    })
  );

  if (rows.length === 0) {
    return <AhoraCard>No payslips yet.</AhoraCard>;
  }

  return (
    <div className="overflow-hidden rounded-2xl">
      <AhoraTable>
        <thead>
          <tr>
            <AhoraTh>Pay period</AhoraTh>
            <AhoraTh>Payout Date</AhoraTh>
            <AhoraTh>Days present</AhoraTh>
            <AhoraTh>Net pay</AhoraTh>
            <AhoraTh />
          </tr>
        </thead>
        <tbody>
          {rows.map(({ period, payslip }) => (
            <tr key={period.id}>
              <AhoraTd>{formatDateRange(period.startDate, period.endDate)}</AhoraTd>
              <AhoraTd>{formatDate(period.payDate)}</AhoraTd>
              <AhoraTd>{payslip?.present ?? 0}</AhoraTd>
              <AhoraTd>{payslip ? php(payslip.netPay) : "—"}</AhoraTd>
              <AhoraTd>
                <Link
                  href={`/employee/payslips/${period.id}`}
                  className="font-medium text-[var(--ahora-chrome)] underline underline-offset-2"
                >
                  View
                </Link>
              </AhoraTd>
            </tr>
          ))}
        </tbody>
      </AhoraTable>
    </div>
  );
}
