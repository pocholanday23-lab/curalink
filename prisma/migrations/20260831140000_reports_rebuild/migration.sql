-- DropTable (unused hourly-engine tables; both empty)
DROP TABLE IF EXISTS "Payslip";
DROP TABLE IF EXISTS "Invoice";

-- CreateTable
CREATE TABLE "CompanySettings" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "registrationId" TEXT,
    "invoiceAddress" TEXT,
    "payslipAddress" TEXT,
    "logoUrl" TEXT,
    "bankName" TEXT,
    "bankAccountName" TEXT,
    "bankAccountNumber" TEXT,
    "bankBranch" TEXT,
    "bankAddress" TEXT,
    "swiftCode" TEXT,
    "serviceChargePct" DECIMAL(5,2) NOT NULL DEFAULT 10,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanySettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientInvoice" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "invoiceDate" TIMESTAMP(3) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "billToName" TEXT NOT NULL,
    "billToAddress" TEXT,
    "coverageNote" TEXT,
    "lineItems" JSONB NOT NULL,
    "totalAmount" DECIMAL(14,2) NOT NULL,
    "payPeriodIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClientInvoice_number_key" ON "ClientInvoice"("number");

-- CreateIndex
CREATE INDEX "ClientInvoice_clientId_idx" ON "ClientInvoice"("clientId");

-- AddForeignKey
ALTER TABLE "ClientInvoice" ADD CONSTRAINT "ClientInvoice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
