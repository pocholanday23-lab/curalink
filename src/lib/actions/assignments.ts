"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

export type AssignmentActionState = { error?: string } | undefined;

function parseRate(value: FormDataEntryValue | null): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export async function createAssignmentAction(
  _prevState: AssignmentActionState,
  formData: FormData
): Promise<AssignmentActionState> {
  await requireUser("ADMIN");

  const employeeId = formData.get("employeeId") as string;
  const clientId = formData.get("clientId") as string;
  const projectName = (formData.get("projectName") as string)?.trim() || null;
  const payRate = parseRate(formData.get("payRate"));
  const billRate = parseRate(formData.get("billRate"));
  const startDateRaw = formData.get("startDate") as string;

  if (!employeeId || !clientId) {
    return { error: "Employee and client are required." };
  }
  if (payRate === null || billRate === null) {
    return { error: "Pay rate and bill rate must be valid non-negative numbers." };
  }
  if (!startDateRaw) {
    return { error: "Start date is required." };
  }

  await prisma.assignment.create({
    data: {
      employeeId,
      clientId,
      projectName,
      payRate,
      billRate,
      startDate: new Date(startDateRaw),
    },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/admin/assignments");
  redirect("/admin/settings");
}

export async function createAssignmentForClientAction(
  clientId: string,
  _prevState: AssignmentActionState,
  formData: FormData
): Promise<AssignmentActionState> {
  await requireUser("ADMIN");

  const employeeId = formData.get("employeeId") as string;
  const projectName = (formData.get("projectName") as string)?.trim() || null;
  const payRate = parseRate(formData.get("payRate") || "0");
  const billRate = parseRate(formData.get("billRate") || "0");
  const startDateRaw = formData.get("startDate") as string;

  if (!employeeId) {
    return { error: "Select an employee to assign to this client." };
  }
  if (payRate === null || billRate === null) {
    return { error: "Pay rate and bill rate must be valid non-negative numbers." };
  }
  if (!startDateRaw) {
    return { error: "Start date is required." };
  }

  const existing = await prisma.assignment.findFirst({
    where: { employeeId, clientId, active: true },
  });
  if (existing) {
    return { error: "That employee already has an active assignment with this client." };
  }

  await prisma.assignment.create({
    data: {
      employeeId,
      clientId,
      projectName,
      payRate,
      billRate,
      startDate: new Date(startDateRaw),
    },
  });

  revalidatePath(`/admin/clients/${clientId}/edit`);
  revalidatePath("/admin/settings");
  return undefined;
}

export async function updateAssignmentAction(
  id: string,
  _prevState: AssignmentActionState,
  formData: FormData
): Promise<AssignmentActionState> {
  await requireUser("ADMIN");

  const projectName = (formData.get("projectName") as string)?.trim() || null;
  const payRate = parseRate(formData.get("payRate"));
  const billRate = parseRate(formData.get("billRate"));
  const startDateRaw = formData.get("startDate") as string;
  const endDateRaw = formData.get("endDate") as string;
  const active = formData.get("active") === "on";

  if (payRate === null || billRate === null) {
    return { error: "Pay rate and bill rate must be valid non-negative numbers." };
  }
  if (!startDateRaw) {
    return { error: "Start date is required." };
  }

  await prisma.assignment.update({
    where: { id },
    data: {
      projectName,
      payRate,
      billRate,
      startDate: new Date(startDateRaw),
      endDate: endDateRaw ? new Date(endDateRaw) : null,
      active,
    },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/admin/assignments");
  redirect("/admin/settings");
}
