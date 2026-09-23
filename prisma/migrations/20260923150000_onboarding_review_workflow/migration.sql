-- AlterTable
ALTER TABLE "Client" ADD COLUMN "address" TEXT;

-- AlterTable
ALTER TABLE "OnboardingInvite"
  ADD COLUMN "confirmedAt" TIMESTAMP(3),
  ADD COLUMN "confirmedById" TEXT,
  ADD COLUMN "sowNotes" TEXT,
  ADD COLUMN "engagementStart" DATE,
  ADD COLUMN "engagementEnd" DATE,
  ADD COLUMN "activatedAt" TIMESTAMP(3),
  ADD COLUMN "activatedById" TEXT;

-- AddForeignKey
ALTER TABLE "OnboardingInvite" ADD CONSTRAINT "OnboardingInvite_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingInvite" ADD CONSTRAINT "OnboardingInvite_activatedById_fkey" FOREIGN KEY ("activatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
