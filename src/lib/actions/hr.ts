"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { generateUsername, nextUsername, usernameBase } from "@/lib/username";
import { parseEmployeeWorkbook } from "@/lib/hr-import";
import {
  parseBankType,
  parseDateLoose,
  parseMaritalStatus,
  parseMoney,
} from "@/lib/hr";
import type { BankAccountType, MaritalStatus, Role } from "@/generated/prisma/client";

const DEFAULT_PASSWORD = "password123";

export type HrActionState = { error?: string } | undefined;

type ProfileScalars = {
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

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  const s = v == null ? "" : String(v).trim();
  return s || null;
}

function readProfileScalars(
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

function readDependents(
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

async function saveProfile(
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

function parseRole(value: FormDataEntryValue | null): Role {
  return value === "MANAGER" || value === "ADMIN"
    ? (value as Role)
    : "EMPLOYEE";
}

function directoryPath(role: Role) {
  return role === "ADMIN" ? "/admin/employees" : "/manager/directory";
}

function revalidateDirectories() {
  revalidatePath("/admin/employees");
  revalidatePath("/manager/directory");
  revalidatePath("/employee/profile");
}

/* ------------------------------------------------------------------ */
/*  Self-service (employee / manager / admin editing their own record) */
/* ------------------------------------------------------------------ */

/**
 * Employees may only change their own email, contact number, emergency contact,
 * and dependents. Every other field is admin/manager-managed and ignored here
 * even if submitted.
 */
export async function saveOwnProfileAction(
  _prevState: HrActionState,
  formData: FormData
): Promise<HrActionState> {
  const user = await requireUser("EMPLOYEE", "MANAGER", "ADMIN");

  const email = str(formData, "email")?.toLowerCase();
  if (email) {
    const clash = await prisma.user.findUnique({ where: { email } });
    if (clash && clash.id !== user.id) {
      return { error: "That email is already in use by another account." };
    }
  }

  const contactNumber = str(formData, "contactNumber");
  const emergencyContactName = str(formData, "emergencyContactName");
  const emergencyContactNumber = str(formData, "emergencyContactNumber");
  const dependents = readDependents(formData);

  if (email) {
    await prisma.user.update({
      where: { id: user.id },
      data: { email },
    });
  }

  await prisma.$transaction(async (tx) => {
    const profile = await tx.employeeProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        contactNumber,
        emergencyContactName,
        emergencyContactNumber,
      },
      update: { contactNumber, emergencyContactName, emergencyContactNumber },
    });
    await tx.dependent.deleteMany({ where: { profileId: profile.id } });
    if (dependents.length > 0) {
      await tx.dependent.createMany({
        data: dependents.map((d) => ({ ...d, profileId: profile.id })),
      });
    }
  });

  revalidateDirectories();
  redirect("/employee/profile");
}

/* ------------------------------------------------------------------ */
/*  Individual create / edit by admin or manager                      */
/* ------------------------------------------------------------------ */

export async function createEmployeeWithProfileAction(
  _prevState: HrActionState,
  formData: FormData
): Promise<HrActionState> {
  const actor = await requireUser("ADMIN", "MANAGER");

  const firstName = str(formData, "firstName");
  const lastName = str(formData, "lastName");
  const emailInput = str(formData, "email")?.toLowerCase() ?? null;

  if (!firstName || !lastName) {
    return { error: "First name and last name are required." };
  }

  const role = actor.role === "ADMIN" ? parseRole(formData.get("role")) : "EMPLOYEE";
  const managerId =
    actor.role === "ADMIN"
      ? str(formData, "managerId")
      : actor.id;

  const username = await generateUsername(firstName, lastName);
  const email = emailInput ?? `${username}@ahora.local`;

  const emailClash = await prisma.user.findUnique({ where: { email } });
  if (emailClash) {
    return { error: `A user with the email ${email} already exists.` };
  }

  const scalars = readProfileScalars(formData, {
    includePay: actor.role === "ADMIN",
  });
  const dependents = readDependents(formData);

  const created = await prisma.user.create({
    data: {
      name: `${firstName} ${lastName}`,
      firstName,
      lastName,
      username,
      email,
      passwordHash: await bcrypt.hash(DEFAULT_PASSWORD, 10),
      mustChangePassword: true,
      role,
      managerId: managerId ?? null,
    },
  });

  await saveProfile(created.id, scalars, dependents);

  revalidateDirectories();
  redirect(directoryPath(actor.role));
}

export async function updateEmployeeWithProfileAction(
  id: string,
  _prevState: HrActionState,
  formData: FormData
): Promise<HrActionState> {
  const actor = await requireUser("ADMIN", "MANAGER");

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return { error: "Employee not found." };
  }
  if (actor.role === "MANAGER" && target.managerId !== actor.id) {
    return { error: "You can only edit your own direct reports." };
  }

  const firstName = str(formData, "firstName");
  const lastName = str(formData, "lastName");
  if (!firstName || !lastName) {
    return { error: "First name and last name are required." };
  }

  const email = str(formData, "email")?.toLowerCase();
  if (email) {
    const clash = await prisma.user.findUnique({ where: { email } });
    if (clash && clash.id !== id) {
      return { error: `A user with the email ${email} already exists.` };
    }
  }

  const canEditPay = actor.role === "ADMIN";
  const scalars = readProfileScalars(formData, { includePay: canEditPay });
  const dependents = readDependents(formData);

  await prisma.user.update({
    where: { id },
    data: {
      name: `${firstName} ${lastName}`,
      firstName,
      lastName,
      ...(email ? { email } : {}),
      ...(canEditPay
        ? {
            role: parseRole(formData.get("role")),
            managerId: str(formData, "managerId"),
            active: formData.get("active") === "on",
          }
        : {}),
    },
  });

  await saveProfile(id, scalars, dependents);

  revalidateDirectories();
  redirect(directoryPath(actor.role));
}

/** Activate / deactivate an employee. Managers may only toggle their own reports. */
export async function setEmployeeActiveAction(
  id: string,
  active: boolean
): Promise<void> {
  const actor = await requireUser("ADMIN", "MANAGER");

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, managerId: true },
  });
  if (!target) return;
  if (target.id === actor.id) return;
  if (target.role === "ADMIN") return;
  if (actor.role === "MANAGER" && target.managerId !== actor.id) return;

  await prisma.user.update({ where: { id }, data: { active } });

  revalidateDirectories();
  revalidatePath(`/admin/employees/${id}`);
  revalidatePath(`/manager/directory/${id}`);
}

/* ------------------------------------------------------------------ */
/*  Bulk upload from an Excel workbook                                 */
/* ------------------------------------------------------------------ */

export async function uploadEmployeesAction(
  _prevState: HrActionState,
  formData: FormData
): Promise<HrActionState> {
  const actor = await requireUser("ADMIN", "MANAGER");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Please choose an Excel file (.xlsx) to upload." };
  }

  const defaultManagerId =
    actor.role === "MANAGER" ? actor.id : str(formData, "managerId");

  let buffer: ArrayBuffer;
  try {
    buffer = await file.arrayBuffer();
  } catch {
    return { error: "Could not read the uploaded file." };
  }

  const parsed = await parseEmployeeWorkbook(buffer);
  if (parsed.rows.length === 0) {
    return {
      error:
        parsed.warnings[0] ??
        "Could not read any employee rows from that file.",
    };
  }

  const existing = await prisma.user.findMany({
    select: { username: true },
  });
  const taken = new Set(existing.map((u) => u.username));

  let created = 0;
  let updated = 0;

  for (const row of parsed.rows) {
    if (!row.firstName || !row.lastName) continue;

    const emailInput = row.email?.toLowerCase() || null;
    let user = emailInput
      ? await prisma.user.findUnique({ where: { email: emailInput } })
      : null;
    if (!user) {
      user = await prisma.user.findFirst({
        where: {
          name: {
            equals: `${row.firstName} ${row.lastName}`,
            mode: "insensitive",
          },
        },
      });
    }

    const scalars: ProfileScalars = {
      middleName: row.middleName ?? null,
      birthDate: row.birthDate ?? null,
      contactNumber: row.contactNumber ?? null,
      homeAddress: row.homeAddress ?? null,
      maritalStatus: row.maritalStatus ?? null,
      spouseName: row.spouseName ?? null,
      sssNo: row.sssNo ?? null,
      tinNo: row.tinNo ?? null,
      pagibigNo: row.pagibigNo ?? null,
      bankName: row.bankName ?? null,
      bankBranch: row.bankBranch ?? null,
      bankAccountName: row.bankAccountName ?? null,
      bankAccountNumber: row.bankAccountNumber ?? null,
      bankType: row.bankType ?? null,
      emergencyContactName: row.emergencyContactName ?? null,
      emergencyContactNumber: row.emergencyContactNumber ?? null,
      salaryUsd: row.salaryUsd ?? null,
      salaryPhp: row.salaryPhp ?? null,
    };

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          firstName: row.firstName,
          lastName: row.lastName,
          name: `${row.firstName} ${row.lastName}`,
          ...(emailInput ? { email: emailInput } : {}),
        },
      });
      updated += 1;
    } else {
      const username = nextUsername(
        usernameBase(row.firstName, row.lastName),
        taken
      );
      const email = emailInput ?? `${username}@ahora.local`;
      if (await prisma.user.findUnique({ where: { email } })) {
        parsed.warnings.push(
          `Skipped ${row.firstName} ${row.lastName}: email ${email} is already in use.`
        );
        continue;
      }
      user = await prisma.user.create({
        data: {
          name: `${row.firstName} ${row.lastName}`,
          firstName: row.firstName,
          lastName: row.lastName,
          username,
          email,
          passwordHash: await bcrypt.hash(DEFAULT_PASSWORD, 10),
          mustChangePassword: true,
          role: "EMPLOYEE",
          managerId: defaultManagerId ?? null,
        },
      });
      created += 1;
    }

    await saveProfile(user.id, scalars, row.dependents);
  }

  revalidateDirectories();

  const params = new URLSearchParams({
    created: String(created),
    updated: String(updated),
    warnings: String(parsed.warnings.length),
  });
  redirect(`${directoryPath(actor.role)}?${params.toString()}`);
}
