import { prisma } from "@/lib/prisma";
import { Card, PageHeader } from "@/components/ui";
import { CuralinkLogo } from "@/components/curalink-logo";
import { PrintButton } from "@/components/print-button";
import { ContractDocument } from "@/components/contract-document";
import { getContractData } from "@/lib/contract";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen justify-center px-4 py-10">
      <div className="w-full max-w-3xl">
        <div className="mb-6 flex justify-center print:hidden">
          <span className="inline-flex items-center rounded-lg bg-white px-3 py-2 text-neutral-800 shadow-sm ring-1 ring-black/5">
            <CuralinkLogo className="h-10 w-10" />
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}

export default async function OnboardingContractPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const invite = await prisma.onboardingInvite.findUnique({ where: { token } });

  if (!invite || !invite.confirmedAt) {
    return (
      <Shell>
        <Card>
          <p className="text-sm">
            {!invite
              ? "This link isn't valid."
              : "Your contract isn't ready yet. We'll email you as soon as it is."}
          </p>
        </Card>
      </Shell>
    );
  }

  const data = await getContractData(invite.id);
  if (!data) {
    return (
      <Shell>
        <Card>
          <p className="text-sm">
            We couldn&apos;t load your contract. Please contact HR.
          </p>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Your contract"
          description="Review, print or save as PDF, sign it, then reply to the email you received with a scanned or photographed copy of the signed contract."
          actions={<PrintButton />}
        />
        <Card className="print:border-0 print:p-0 print:shadow-none">
          <ContractDocument data={data} />
        </Card>
      </div>
    </Shell>
  );
}
