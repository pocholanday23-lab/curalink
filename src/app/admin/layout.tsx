import { requireUser } from "@/lib/dal";
import { NavBar } from "@/components/nav";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/employees", label: "Employees" },
  { href: "/admin/attendance", label: "Attendance" },
  { href: "/admin/pay-periods", label: "Pay Periods" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/settings", label: "Settings" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser("ADMIN");

  return (
    <div className="min-h-screen">
      <NavBar
        links={links}
        userName={user.name ?? user.email ?? ""}
        roleLabel="Admin"
        theme="green"
      />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
