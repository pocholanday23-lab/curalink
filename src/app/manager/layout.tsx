import { requireUser } from "@/lib/dal";
import { ImpersonationBanner } from "@/components/impersonation-banner";
import { AhoraSidebar, AhoraTopBar, type AhoraLink } from "@/components/ahora/shell";

const links: AhoraLink[] = [
  { href: "/manager/directory", label: "Directory", icon: "team" },
  { href: "/manager/attendance", label: "Attendance", icon: "attendance" },
  { href: "/manager/time-log", label: "Team Time Log", icon: "calendar" },
  { href: "/employee", label: "Clock In/Out", icon: "home", newGroup: true },
  { href: "/employee/time-card", label: "My Time Card", icon: "calendar" },
  { href: "/employee/payslips", label: "My Payslips", icon: "payslip" },
];

export default async function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser("MANAGER");

  return (
    <div className="flex min-h-screen">
      <AhoraSidebar links={links} labeled />
      <div className="flex min-w-0 flex-1 flex-col bg-white text-neutral-900">
        {user.impersonatorId && (
          <ImpersonationBanner
            name={user.name ?? user.email ?? ""}
            impersonatorName={user.impersonatorName}
          />
        )}
        <AhoraTopBar userName={user.name ?? user.email ?? ""} roleLabel="Manager" />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-8 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
