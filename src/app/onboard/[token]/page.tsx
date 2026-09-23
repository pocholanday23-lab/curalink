import { prisma } from "@/lib/prisma";
import { Card, PageHeader } from "@/components/ui";
import { CuralinkLogo } from "@/components/curalink-logo";
import { ProfileForm } from "@/components/profile-form";
import { completeOnboardingAction } from "@/lib/actions/onboarding-invites";

function isPast(date: Date): boolean {
  return date.getTime() < Date.now();
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        <div className="mb-6 flex justify-center">
          <span className="inline-flex items-center rounded-lg bg-white px-3 py-2 text-neutral-800 shadow-sm ring-1 ring-black/5">
            <CuralinkLogo className="h-10 w-10" />
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const invite = await prisma.onboardingInvite.findUnique({
    where: { token },
    include: { manager: { select: { name: true } } },
  });

  if (!invite) {
    return (
      <Shell>
        <Card>
          <p className="text-sm">
            This sign-up link isn&apos;t valid. Please ask your manager or HR
            for a new invite.
          </p>
        </Card>
      </Shell>
    );
  }

  if (invite.completedAt) {
    let message: React.ReactNode;
    if (invite.activatedAt) {
      message = (
        <>
          You&apos;re all set! Check <strong>{invite.email}</strong> for your
          username and password — you can sign in at{" "}
          <a href="/login" className="underline underline-offset-2">
            /login
          </a>
          .
        </>
      );
    } else if (invite.confirmedAt) {
      message = (
        <>
          Your sign-up has been confirmed! Check <strong>{invite.email}</strong>{" "}
          for your contract, or{" "}
          <a
            href={`/onboard/${token}/contract`}
            className="underline underline-offset-2"
          >
            view it here
          </a>
          . Once we receive your signed copy, we&apos;ll send your login
          details.
        </>
      );
    } else {
      message = (
        <>
          Thanks! Your information has been submitted for{" "}
          <strong>{invite.email}</strong> and is being reviewed. We&apos;ll
          email you with next steps.
        </>
      );
    }
    return (
      <Shell>
        <Card>
          <p className="text-sm">{message}</p>
        </Card>
      </Shell>
    );
  }

  if (isPast(invite.expiresAt)) {
    return (
      <Shell>
        <Card>
          <p className="text-sm">
            This sign-up link has expired. Please ask your manager or HR to
            send you a new one.
          </p>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell>
      <PageHeader
        title="Welcome!"
        description="Fill in your details to finish setting up your HR record. Your manager and salary are set separately and aren't collected here."
      />
      <Card>
        <ProfileForm
          mode="create"
          action={completeOnboardingAction.bind(null, token)}
          lockedEmail={invite.email}
          assignedManagerName={invite.manager?.name ?? null}
          submitLabel="Submit"
          strict
        />
      </Card>
    </Shell>
  );
}
