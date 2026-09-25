import { requireUser } from "@/lib/dal";
import { ImpersonationBanner } from "@/components/impersonation-banner";
import {
  AhoraAutoSectionTab,
  AhoraSidebar,
  AhoraTopBar,
} from "@/components/ahora/shell";

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser("EMPLOYEE", "MANAGER");
  const isManager = user.role === "MANAGER";

  return (
    <div className="flex min-h-screen">
      <AhoraSidebar isManager={isManager} />
      <div className="flex min-w-0 flex-1 flex-col bg-white text-neutral-900">
        {user.impersonatorId && (
          <ImpersonationBanner
            name={user.name ?? user.email ?? ""}
            impersonatorName={user.impersonatorName}
          />
        )}
        <AhoraTopBar userName={user.name ?? user.email ?? ""} />
        <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8">
          <AhoraAutoSectionTab />
          {children}
        </main>
      </div>
    </div>
  );
}
