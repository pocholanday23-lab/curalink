import { prisma } from "@/lib/prisma";

export const COMPANY_SETTINGS_ID = "default";

export type CompanySettings = {
  name: string;
  registrationId: string | null;
  invoiceAddress: string | null;
  payslipAddress: string | null;
  logoUrl: string | null;
  bankName: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  bankBranch: string | null;
  bankAddress: string | null;
  swiftCode: string | null;
  serviceChargePct: number;
};

const DEFAULTS: CompanySettings = {
  name: "Curalink Management Incorporated",
  registrationId: null,
  invoiceAddress: null,
  payslipAddress: null,
  logoUrl: null,
  bankName: null,
  bankAccountName: null,
  bankAccountNumber: null,
  bankBranch: null,
  bankAddress: null,
  swiftCode: null,
  serviceChargePct: 10,
};

export async function getCompanySettings(): Promise<CompanySettings> {
  const row = await prisma.companySettings.findFirst();
  if (!row) return DEFAULTS;
  return {
    name: row.name,
    registrationId: row.registrationId,
    invoiceAddress: row.invoiceAddress,
    payslipAddress: row.payslipAddress,
    logoUrl: row.logoUrl,
    bankName: row.bankName,
    bankAccountName: row.bankAccountName,
    bankAccountNumber: row.bankAccountNumber,
    bankBranch: row.bankBranch,
    bankAddress: row.bankAddress,
    swiftCode: row.swiftCode,
    serviceChargePct: Number(row.serviceChargePct),
  };
}
