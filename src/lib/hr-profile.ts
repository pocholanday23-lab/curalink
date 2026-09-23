import "server-only";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  parseBankType,
  parseDateLoose,
  parseMaritalStatus,
  parseMoney,
} from "@/lib/hr";
import type { BankAccountType, MaritalStatus } from "@/generated/prisma/client";

/**
 * Shared form-parsing / persistence helpers for an employee's HR profile.
 * Split out from src/lib/actions/hr.ts (a "use server" file, which may only
 * export async actions) so onboarding.ts can reuse them too.
 */

export type ProfileScalars = {
  middleName: string | null;
  birthDate: Date | null;
  contactNumber: string | null;
  homeAddress: string | null;
  maritalStatus: MaritalStatus | null;
  spouseName: string | null;
  sssNo: string | null;
  tinNo: string | null;
  pagibigNo: string | null;
  bankName: string | null;
  bankBranch: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  bankType: BankAccountType | null;
  emergencyContactName: string | null;
  emergencyContactNumber: string | null;
  salaryUsd?: number | null;
  salaryPhp?: number | null;
};

export function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  const s = v == null ? "" : String(v).trim();
  return s || null;
}

export function readProfileScalars(
  formData: FormData,
  opts: { includePay: boolean }
): ProfileScalars {
  const scalars: ProfileScalars = {
    middleName: str(formData, "middleName"),
    birthDate: parseDateLoose(str(formData, "birthDate")),
    contactNumber: str(formData, "contactNumber"),
    homeAddress: str(formData, "homeAddress"),
    maritalStatus: parseMaritalStatus(str(formData, "maritalStatus")),
    spouseName: str(formData, "spouseName"),
    sssNo: str(formData, "sssNo"),
    tinNo: str(formData, "tinNo"),
    pagibigNo: str(formData, "pagibigNo"),
    bankName: str(formData, "bankName"),
    bankBranch: str(formData, "bankBranch"),
    bankAccountName: str(formData, "bankAccountName"),
    bankAccountNumber: str(formData, "bankAccountNumber"),
    bankType: parseBankType(str(formData, "bankType")),
    emergencyContactName: str(formData, "emergencyContactName"),
    emergencyContactNumber: str(formData, "emergencyContactNumber"),
  };
  if (opts.includePay) {
    scalars.salaryUsd = parseMoney(str(formData, "salaryUsd"));
    scalars.salaryPhp = parseMoney(str(formData, "salaryPhp"));
  }
  return scalars;
}

export function readDependents(
  formData: FormData
): { name: string; birthDate: string | null }[] {
  const names = formData.getAll("dependentName").map(String);
  const births = formData.getAll("dependentBirthDate").map(String);
  const out: { name: string; birthDate: string | null }[] = [];
  for (let i = 0; i < names.length; i++) {
    const name = names[i]?.trim();
    if (!name) continue;
    const bd = (births[i] ?? "").trim();
    out.push({ name, birthDate: bd || null });
  }
  return out;
}

export async function saveProfile(
  userId: string,
  scalars: ProfileScalars,
  dependents: { name: string; birthDate: string | null }[]
) {
  await prisma.$transaction(async (tx) => {
    const profile = await tx.employeeProfile.upsert({
      where: { userId },
      create: { userId, ...scalars },
      update: scalars,
    });
    await tx.dependent.deleteMany({ where: { profileId: profile.id } });
    if (dependents.length > 0) {
      await tx.dependent.createMany({
        data: dependents.map((d) => ({ ...d, profileId: profile.id })),
      });
    }
  });
}

export function revalidateDirectories() {
  revalidatePath("/admin/employees");
  revalidatePath("/manager/directory");
  revalidatePath("/employee/profile");
}
