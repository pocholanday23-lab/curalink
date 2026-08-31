import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { Card, PageHeader, Table, Td, Th } from "@/components/ui";
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

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Payslips"
        description="Payslips are available once your admin closes a pay period."
      />
      <Card className="p-0">
        <Table>
          <thead>
            <tr>
              <Th>Pay period</Th>
              <Th>Pay date</Th>
              <Th>Days present</Th>
              <Th>Net pay</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <Td colSpan={5} className="text-black/50">
                  No payslips yet.
                </Td>
              </tr>
            )}
            {rows.map(({ period, payslip }) => (
              <tr
                key={period.id}
                className="border-t border-black/5 dark:border-white/5"
              >
                <Td>{formatDateRange(period.startDate, period.endDate)}</Td>
                <Td>{formatDate(period.payDate)}</Td>
                <Td>{payslip?.present ?? 0}</Td>
                <Td>{payslip ? php(payslip.netPay) : "—"}</Td>
                <Td>
                  <Link
                    href={`/employee/payslips/${period.id}`}
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
