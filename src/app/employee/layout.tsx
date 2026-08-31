import { requireUser } from "@/lib/dal";
import { NavBar } from "@/components/nav";
import { ImpersonationBanner } from "@/components/impersonation-banner";

const selfLinks = [
  { href: "/employee", label: "Clock In/Out" },
  { href: "/employee/time-card", label: "Time Card" },
  { href: "/employee/payslips", label: "Payslips" },
  { href: "/employee/profile", label: "My Info" },
];

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser("EMPLOYEE", "MANAGER");
  const isManager = user.role === "MANAGER";

  const links = isManager
    ? [{ href: "/manager/directory", label: "← Team" }, ...selfLinks]
    : selfLinks;

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
        roleLabel={isManager ? "Manager" : "Employee"}
        theme="green"
      />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
