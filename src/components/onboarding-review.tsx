import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge, Button, Card, PageHeader } from "@/components/ui";
import { formatDate, formatDateTime } from "@/lib/format";
import { OnboardingConfirmForm } from "@/components/onboarding-confirm-form";
import { activateOnboardingInviteAction } from "@/lib/actions/onboarding-invites";

export async function OnboardingReview({
  actor,
  id,
  basePath,
}: {
  actor: { id: string; role: string };
  id: string;
  basePath: "/admin/employees" | "/manager/directory";
}) {
  const invite = await prisma.onboardingInvite.findUnique({
    where: { id },
    include: {
      completedUser: { include: { profile: true } },
      manager: { select: { name: true } },
      invitedBy: { select: { name: true } },
      confirmedBy: { select: { name: true } },
      activatedBy: { select: { name: true } },
    },
  });

  if (!invite) notFound();
  if (
    actor.role === "MANAGER" &&
    invite.invitedById !== actor.id &&
    invite.managerId !== actor.id
  ) {
    notFound();
  }

  if (!invite.completedAt || !invite.completedUser) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Sign-up not submitted yet" />
        <Card>
          <p className="text-sm">
            {invite.email} hasn&apos;t completed their sign-up form yet.
          </p>
          <Link
            href={basePath}
            className="mt-3 inline-block text-sm underline underline-offset-2"
          >
            Back to the list
          </Link>
        </Card>
      </div>
    );
  }

  const employee = invite.completedUser;
  const assignment = await prisma.assignment.findFirst({
    where: { employeeId: employee.id },
    orderBy: { startDate: "desc" },
    include: { client: true },
  });

  const clients = await prisma.client.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Review sign-up: ${employee.name}`}
        description={invite.email}
        actions={
          <Badge tone={employee.active ? "green" : "amber"}>
            {employee.active ? "Active" : "Awaiting activation"}
          </Badge>
        }
      />

      <Card className="flex flex-col gap-2 text-sm">
        <p>
          <span className="font-semibold">Submitted:</span>{" "}
          {formatDateTime(invite.completedAt)}
        </p>
        <p>
          <span className="font-semibold">Invited by:</span>{" "}
          {invite.invitedBy?.name ?? "—"}
          {invite.manager && ` · Manager: ${invite.manager.name}`}
        </p>
        <p>
          <span className="font-semibold">Contact:</span>{" "}
          {employee.profile?.contactNumber ?? "—"}
        </p>
        <p>
          <span className="font-semibold">Address:</span>{" "}
          {employee.profile?.homeAddress ?? "—"}
        </p>
        <Link
          href={`${basePath}/${employee.id}/edit`}
          className="text-sm underline underline-offset-2"
        >
          View / edit full profile
        </Link>
      </Card>

      {!invite.confirmedAt ? (
        <Card>
          <h2 className="mb-4 text-sm font-semibold">
            Assign client, project, and salary
          </h2>
          <OnboardingConfirmForm inviteId={invite.id} clients={clients} />
        </Card>
      ) : (
        <Card className="flex flex-col gap-3 text-sm">
          <p>
            <span className="font-semibold">Confirmed:</span>{" "}
            {formatDateTime(invite.confirmedAt)} by{" "}
            {invite.confirmedBy?.name ?? "—"}
          </p>
          <p>
            <span className="font-semibold">Client:</span>{" "}
            {assignment?.client.name ?? "—"}
            {assignment?.projectName ? ` — ${assignment.projectName}` : ""}
          </p>
          <p>
            <span className="font-semibold">Salary:</span>{" "}
            {employee.profile?.salaryPhp != null
              ? `₱${Number(employee.profile.salaryPhp).toLocaleString()}`
              : "—"}
            {employee.profile?.salaryUsd != null &&
              ` / $${Number(employee.profile.salaryUsd).toLocaleString()}`}
          </p>
          <p>
            <span className="font-semibold">Engagement:</span>{" "}
            {invite.engagementStart ? formatDate(invite.engagementStart) : "—"}
            {invite.engagementEnd ? ` – ${formatDate(invite.engagementEnd)}` : " onward"}
          </p>

          {!invite.activatedAt ? (
            <form action={activateOnboardingInviteAction.bind(null, invite.id)}>
              <Button type="submit">Activate & email login details</Button>
            </form>
          ) : (
            <p className="text-green-700 dark:text-green-400">
              Activated {formatDateTime(invite.activatedAt)} by{" "}
              {invite.activatedBy?.name ?? "—"}. The account is live.
            </p>
          )}
        </Card>
      )}
    </div>
  );
}
