import { requireUser } from "@/lib/dal";
import { NavBar } from "@/components/nav";
import { ImpersonationBanner } from "@/components/impersonation-banner";

const links = [
  { href: "/manager/directory", label: "Directory" },
  { href: "/manager/attendance", label: "Attendance" },
  { href: "/manager/time-log", label: "Team Time Log" },
  { href: "/employee", label: "Clock In/Out" },
  { href: "/employee/time-card", label: "My Time Card" },
  { href: "/employee/payslips", label: "My Payslips" },
];

export default async function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser("MANAGER");

  return (
    <div className="min-h-screen">
      {user.impersonatorId && (
        <ImpersonationBanner
          name={user.name ?? user.email ?? ""}
          impersonatorName={user.impersonatorName}
        />
      )}
      <NavBar
        links={links}
        userName={user.name ?? user.email ?? ""}
        roleLabel="Manager"
        theme="green"
      />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
