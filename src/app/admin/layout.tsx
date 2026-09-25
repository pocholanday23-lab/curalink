import { requireUser } from "@/lib/dal";
import { AhoraSidebar, AhoraTopBar, type AhoraLink } from "@/components/ahora/shell";

const links: AhoraLink[] = [
  { href: "/admin", label: "Dashboard", icon: "home" },
  { href: "/admin/employees", label: "Employees", icon: "team" },
  { href: "/admin/attendance", label: "Attendance", icon: "attendance" },
  { href: "/admin/pay-periods", label: "Pay Periods", icon: "calendar" },
  { href: "/admin/reports", label: "Reports", icon: "reports" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser("ADMIN");

  return (
    <div className="flex min-h-screen">
      <AhoraSidebar links={links} labeled />
      <div className="flex min-w-0 flex-1 flex-col bg-white text-neutral-900">
        <AhoraTopBar userName={user.name ?? user.email ?? ""} roleLabel="Admin" />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-8 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
