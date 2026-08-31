"use server";

import crypto from "crypto";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { parseAttendanceWorkbook } from "@/lib/attendance-import";
import { toISODate } from "@/lib/attendance";
import { nextUsername, usernameBase } from "@/lib/username";
import type { AttendanceStatus, Role } from "@/generated/prisma/client";

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

export type AttendanceUploadState = { error?: string } | undefined;
export type AttendanceCellState = { error?: string };

function pathForRole(role: Role) {
  return role === "ADMIN" ? "/admin/attendance" : "/manager/attendance";
}

async function uniqueImportedEmail(fullName: string) {
  const base =
    fullName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/(^\.+|\.+$)/g, "") || "employee";
  let email = `${base}@imported.local`;
  let suffix = 1;
  while (await prisma.user.findUnique({ where: { email } })) {
    suffix += 1;
    email = `${base}${suffix}@imported.local`;
  }
  return email;
}

export async function uploadAttendanceAction(
  _prevState: AttendanceUploadState,
  formData: FormData
): Promise<AttendanceUploadState> {
  const user = await requireUser("ADMIN", "MANAGER");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Please choose an Excel file (.xlsx) to upload." };
  }

  const fallbackYearRaw = formData.get("fallbackYear") as string | null;
  const fallbackYear = fallbackYearRaw ? Number(fallbackYearRaw) : undefined;

  let buffer: ArrayBuffer;
  try {
    buffer = await file.arrayBuffer();
  } catch {
    return { error: "Could not read the uploaded file." };
  }

  const parsed = await parseAttendanceWorkbook(buffer, { fallbackYear });

  if (parsed.rows.length === 0 || parsed.dates.length === 0) {
    return {
      error:
        parsed.warnings[0] ?? "Could not read any attendance data from that file.",
    };
  }

  const employeeIdByName = new Map<string, string>();
  const takenUsernames = new Set(
    (await prisma.user.findMany({ select: { username: true } })).map(
      (u) => u.username
    )
  );
  let created = 0;
  let matched = 0;
  let recordsImported = 0;

  for (const row of parsed.rows) {
    if (!row.fullName) continue;
    const key = row.fullName.toLowerCase();
    let employeeId = employeeIdByName.get(key);
    if (!employeeId) {
      const existing = await prisma.user.findFirst({
        where: { name: { equals: row.fullName, mode: "insensitive" } },
      });
      if (existing) {
        employeeId = existing.id;
        matched += 1;
        if (user.role === "MANAGER" && existing.managerId === null) {
          await prisma.user.update({
            where: { id: existing.id },
            data: { managerId: user.id },
          });
        }
      } else {
        const email = await uniqueImportedEmail(row.fullName);
        const passwordHash = await bcrypt.hash(
          crypto.randomBytes(12).toString("hex"),
          10
        );
        const { firstName, lastName } = splitName(row.fullName);
        const newUser = await prisma.user.create({
          data: {
            name: row.fullName,
            firstName,
            lastName,
            username: nextUsername(
              usernameBase(firstName, lastName),
              takenUsernames
            ),
            email,
            passwordHash,
            mustChangePassword: true,
            role: "EMPLOYEE",
            managerId: user.role === "MANAGER" ? user.id : null,
          },
        });
        employeeId = newUser.id;
        created += 1;
      }
      employeeIdByName.set(key, employeeId);
    }

    for (const [dateISO, status] of row.statuses) {
      await prisma.attendanceRecord.upsert({
        where: { employeeId_date: { employeeId, date: new Date(dateISO) } },
        create: { employeeId, date: new Date(dateISO), status },
        update: { status },
      });
      recordsImported += 1;
    }
  }

  revalidatePath("/admin/attendance");
  revalidatePath("/manager/attendance");

  const start = toISODate(parsed.dates[0]);
  const end = toISODate(parsed.dates[parsed.dates.length - 1]);
  const params = new URLSearchParams({
    start,
    end,
    imported: String(recordsImported),
    created: String(created),
    matched: String(matched),
    warnings: String(parsed.warnings.length),
  });
  redirect(`${pathForRole(user.role)}?${params.toString()}`);
}

export async function setAttendanceStatusAction(
  employeeId: string,
  dateISO: string,
  status: AttendanceStatus | null
): Promise<AttendanceCellState> {
  const user = await requireUser("ADMIN", "MANAGER");

  if (user.role === "MANAGER") {
    const employee = await prisma.user.findFirst({
      where: { id: employeeId, managerId: user.id },
      select: { id: true },
    });
    if (!employee) {
      return { error: "You can only edit attendance for your direct reports." };
    }
  }

  const date = new Date(dateISO);
  if (Number.isNaN(date.getTime())) {
    return { error: "Invalid date." };
  }

  if (status === null) {
    await prisma.attendanceRecord.deleteMany({ where: { employeeId, date } });
  } else {
    await prisma.attendanceRecord.upsert({
      where: { employeeId_date: { employeeId, date } },
      create: { employeeId, date, status },
      update: { status },
    });
  }

  revalidatePath("/admin/attendance");
  revalidatePath("/manager/attendance");
  return {};
}
