import "server-only";
import { prisma } from "@/lib/prisma";
import { getCompanySettings } from "@/lib/company";

export type ContractData = {
  companyName: string;
  companyAddress: string | null;
  contractorName: string;
  contractorAddress: string | null;
  endClientName: string | null;
  endClientAddress: string | null;
  projectName: string | null;
  agreementDate: Date;
  engagementStart: Date;
  engagementEnd: Date | null;
  serviceFeePhp: number | null;
  serviceFeeUsd: number | null;
  sowNotes: string | null;
};

/**
 * Everything needed to render the contract for a confirmed onboarding
 * invite. Returns null if the invite isn't confirmed yet (no contract to
 * show) or its account/assignment can't be found.
 */
export async function getContractData(
  inviteId: string
): Promise<ContractData | null> {
  const invite = await prisma.onboardingInvite.findUnique({
    where: { id: inviteId },
  });
  if (!invite || !invite.confirmedAt || !invite.completedUserId) return null;

  const [company, employee] = await Promise.all([
    getCompanySettings(),
    prisma.user.findUnique({
      where: { id: invite.completedUserId },
      include: { profile: true },
    }),
  ]);
  if (!employee) return null;

  const assignment = await prisma.assignment.findFirst({
    where: { employeeId: employee.id },
    orderBy: { startDate: "desc" },
    include: { client: true },
  });

  return {
    companyName: company.name,
    companyAddress: company.payslipAddress,
    contractorName: employee.name,
    contractorAddress: employee.profile?.homeAddress ?? null,
    endClientName: assignment?.client.name ?? null,
    endClientAddress: assignment?.client.address ?? null,
    projectName: assignment?.projectName ?? null,
    agreementDate: invite.confirmedAt,
    engagementStart: invite.engagementStart ?? invite.confirmedAt,
    engagementEnd: invite.engagementEnd,
    serviceFeePhp:
      employee.profile?.salaryPhp != null
        ? Number(employee.profile.salaryPhp)
        : null,
    serviceFeeUsd:
      employee.profile?.salaryUsd != null
        ? Number(employee.profile.salaryUsd)
        : null,
    sowNotes: invite.sowNotes,
  };
}
