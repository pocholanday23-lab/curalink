import { notFound } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { Button, Card } from "@/components/ui";
import { startImpersonationAction } from "@/lib/actions/impersonation";

export default async function ImpersonateConfirmPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = await requireUser("ADMIN");

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, username: true, role: true, active: true },
  });
  if (!target) notFound();

  const blocked =
    !target.active || target.role === "ADMIN" || target.id === admin.id;

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Card className="flex flex-col gap-4">
          <div>
            <h1 className="text-lg font-semibold">Log in as another user</h1>
            <p className="mt-1 text-sm text-black/60 dark:text-white/60">
              You are about to switch this browser&apos;s session to{" "}
              <span className="font-medium">{target.name}</span> (@
              {target.username}, {target.role.toLowerCase()}).
            </p>
          </div>

          {blocked ? (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
              {target.role === "ADMIN"
                ? "Admins cannot be impersonated."
                : target.id === admin.id
                  ? "That's you."
                  : "That account is inactive."}
            </p>
          ) : (
            <p className="rounded-md bg-black/[0.03] px-3 py-2 text-xs text-black/60 dark:bg-white/[0.06] dark:text-white/60">
              Your admin session in other tabs will also become this user until
              you choose <span className="font-medium">Exit</span> from the
              banner. To keep an admin session open at the same time, use a
              separate browser or a private window.
            </p>
          )}

          <div className="flex gap-2">
            <form action={startImpersonationAction.bind(null, target.id)}>
              <Button type="submit" disabled={blocked}>
                Continue as {target.name.split(" ")[0]}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
