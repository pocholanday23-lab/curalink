"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { COMPANY_SETTINGS_ID } from "@/lib/company";

export type CompanySettingsState = { error?: string; saved?: boolean } | undefined;

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  const s = v == null ? "" : String(v).trim();
  return s || null;
}

export async function saveCompanySettingsAction(
  _prevState: CompanySettingsState,
  formData: FormData
): Promise<CompanySettingsState> {
  await requireUser("ADMIN");

  const name = str(formData, "name");
  if (!name) {
    return { error: "Company name is required." };
  }

  const pctRaw = str(formData, "serviceChargePct");
  const serviceChargePct = pctRaw != null ? Number(pctRaw) : 10;
  if (!Number.isFinite(serviceChargePct) || serviceChargePct < 0) {
    return { error: "Service charge % must be a non-negative number." };
  }

  const data = {
    name,
    registrationId: str(formData, "registrationId"),
    invoiceAddress: str(formData, "invoiceAddress"),
    payslipAddress: str(formData, "payslipAddress"),
    logoUrl: str(formData, "logoUrl"),
    bankName: str(formData, "bankName"),
    bankAccountName: str(formData, "bankAccountName"),
    bankAccountNumber: str(formData, "bankAccountNumber"),
    bankBranch: str(formData, "bankBranch"),
    bankAddress: str(formData, "bankAddress"),
    swiftCode: str(formData, "swiftCode"),
    serviceChargePct,
  };

  await prisma.companySettings.upsert({
    where: { id: COMPANY_SETTINGS_ID },
    create: { id: COMPANY_SETTINGS_ID, ...data },
    update: data,
  });

  revalidatePath("/admin/settings");
  revalidatePath("/admin/reports/invoices");
  revalidatePath("/admin/reports/payslips");
  return { saved: true };
}
