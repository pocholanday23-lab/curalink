import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { Card, PageHeader } from "@/components/ui";

const sections = [
  {
    href: "/admin/reports/payroll",
    title: "Payroll",
    body: "Per cut-off pay run — monthly salary prorated by attendance. Closed periods only. Exportable to CSV.",
  },
  {
    href: "/admin/reports/payslips",
    title: "Payslips",
    body: "Individual employee payslips for a pay period, in the company format. Filter by employee, print to PDF.",
  },
  {
    href: "/admin/reports/invoices",
    title: "Client invoices",
    body: "Build a client invoice from payroll actuals plus manual adjustments. Renders the company layout and prints to PDF.",
  },
  {
    href: "/admin/reports/time-log",
    title: "Time log",
    body: "Clock in / out entries for a pay period, filterable by employee.",
  },
];

export default async function ReportsPage() {
  await requireUser("ADMIN");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reports"
        description="Payroll, payslips, and client invoicing."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((s) => (
          <Link key={s.href} href={s.href}>
            <Card className="h-full transition-colors hover:border-black/30 dark:hover:border-white/30">
              <h2 className="text-sm font-semibold">{s.title}</h2>
              <p className="mt-1 text-sm text-black/60 dark:text-white/60">
                {s.body}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
