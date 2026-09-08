-- AlterTable: cost-of-salary cycle + link to the prior invoice for the "Advance Salary (Paid)" line
ALTER TABLE "ClientInvoice"
  ADD COLUMN "billedFrom" DATE,
  ADD COLUMN "billedTo" DATE,
  ADD COLUMN "previousInvoiceId" TEXT;
