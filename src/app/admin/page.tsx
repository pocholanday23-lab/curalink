import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  const [employeeCount, clientCount, assignmentCount, openPeriod] =
    await Promise.all([
      prisma.user.count({ where: { role: "EMPLOYEE" } }),
      prisma.client.count({ where: { active: true } }),
      prisma.assignment.count({ where: { active: true } }),
      prisma.payPeriod.findFirst({
        where: { status: "OPEN" },
        orderBy: { startDate: "asc" },
      }),
    ]);

  const tiles = [
    {
      label: "Active employees",
      value: employeeCount,
      href: "/admin/employees",
      accent: "var(--green-forest)",
    },
    {
      label: "Active clients",
      value: clientCount,
      href: "/admin/settings",
      accent: "var(--green-sage)",
    },
    {
      label: "Active assignments",
      value: assignmentCount,
      href: "/admin/settings",
      accent: "var(--green-moss)",
    },
    {
      label: "Current pay period",
      value: openPeriod ? "Open" : "None open",
      href: "/admin/pay-periods",
      accent: "var(--green-khaki)",
    },
  ];

  return (
    <div className="flex flex-col gap-6 text-white">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Admin dashboard
        </h1>
        <p className="mt-1 text-sm text-white/70">
          Manage employees, clients, rates, pay periods, and reports.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <Link
            key={tile.label}
            href={tile.href}
            className="rounded-lg border-l-4 p-5 shadow-sm transition hover:brightness-110"
            style={{
              backgroundColor: "var(--green-olive)",
              borderLeftColor: tile.accent,
            }}
          >
            <p className="text-sm text-white/80">{tile.label}</p>
            <p className="mt-1 text-3xl font-semibold">{tile.value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
