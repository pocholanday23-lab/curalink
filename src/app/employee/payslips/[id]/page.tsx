import { notFound } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { Card } from "@/components/ui";
import { PrintButton } from "@/components/print-button";
import { PayslipDocument } from "@/components/payslip-document";
import { computePayslipsForPeriod, type PayslipBatch } from "@/lib/payslip";

export default async function EmployeePayslipDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser("EMPLOYEE", "MANAGER");

  let batch: PayslipBatch;
  try {
    batch = await computePayslipsForPeriod(id);
  } catch {
    notFound();
  }

  const mine = batch.payslips.find((s) => s.employeeId === user.id);
  if (!mine) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-semibold tracking-tight">Payslip</h1>
        <PrintButton />
      </div>
      <Card className="print:border-0 print:p-0 print:shadow-none">
        <PayslipDocument
          company={batch.company}
          payslip={mine}
          periodLabel={batch.periodLabel}
          dateProcessed={batch.period.payDate}
          workingDaysMonth={batch.workingDaysMonth}
        />
      </Card>
    </div>
  );
}
