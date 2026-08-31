-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('SINGLE', 'MARRIED', 'SEPARATED', 'WIDOWED', 'DIVORCED');

-- CreateEnum
CREATE TYPE "BankAccountType" AS ENUM ('SAVINGS', 'CHECKING');

-- AlterTable
ALTER TABLE "User"
    ADD COLUMN "username" TEXT,
    ADD COLUMN "firstName" TEXT,
    ADD COLUMN "lastName" TEXT,
    ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT true;

-- Backfill usernames for any pre-existing rows (local part of the email).
UPDATE "User" SET "username" = lower(split_part("email", '@', 1)) WHERE "username" IS NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;

-- CreateTable
CREATE TABLE "EmployeeProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "middleName" TEXT,
    "salaryUsd" DECIMAL(12,2),
    "salaryPhp" DECIMAL(12,2),
    "birthDate" DATE,
    "contactNumber" TEXT,
    "homeAddress" TEXT,
    "maritalStatus" "MaritalStatus",
    "spouseName" TEXT,
    "sssNo" TEXT,
    "tinNo" TEXT,
    "pagibigNo" TEXT,
    "bankName" TEXT,
    "bankBranch" TEXT,
    "bankAccountName" TEXT,
    "bankAccountNumber" TEXT,
    "bankType" "BankAccountType",
    "emergencyContactName" TEXT,
    "emergencyContactNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dependent" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "birthDate" TEXT,

    CONSTRAINT "Dependent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeProfile_userId_key" ON "EmployeeProfile"("userId");

-- CreateIndex
CREATE INDEX "Dependent_profileId_idx" ON "Dependent"("profileId");

-- AddForeignKey
ALTER TABLE "EmployeeProfile" ADD CONSTRAINT "EmployeeProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dependent" ADD CONSTRAINT "Dependent_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "EmployeeProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
