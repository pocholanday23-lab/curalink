-- AlterEnum
ALTER TYPE "EmailKind" ADD VALUE 'ONBOARDING_INVITE';

-- CreateTable
CREATE TABLE "OnboardingInvite" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "managerId" TEXT,
    "invitedById" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3),
    "completedUserId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OnboardingInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingInvite_token_key" ON "OnboardingInvite"("token");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingInvite_completedUserId_key" ON "OnboardingInvite"("completedUserId");

-- CreateIndex
CREATE INDEX "OnboardingInvite_email_idx" ON "OnboardingInvite"("email");

-- AddForeignKey
ALTER TABLE "OnboardingInvite" ADD CONSTRAINT "OnboardingInvite_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingInvite" ADD CONSTRAINT "OnboardingInvite_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingInvite" ADD CONSTRAINT "OnboardingInvite_completedUserId_fkey" FOREIGN KEY ("completedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
