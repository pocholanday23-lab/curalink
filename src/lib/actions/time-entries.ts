"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

export type TimeEntryActionState = { error?: string } | undefined;

export async function clockInAction(
  _prevState: TimeEntryActionState,
  formData: FormData
): Promise<TimeEntryActionState> {
  const user = await requireUser("EMPLOYEE", "MANAGER");

  const openEntry = await prisma.timeEntry.findFirst({
    where: { employeeId: user.id, clockOut: null },
  });
  if (openEntry) {
    return { error: "You are already clocked in." };
  }

  let assignmentId = formData.get("assignmentId") as string | null;

  if (!assignmentId) {
    const activeAssignments = await prisma.assignment.findMany({
      where: { employeeId: user.id, active: true },
      select: { id: true },
    });
    if (activeAssignments.length !== 1) {
      return { error: "Select which client/project you're clocking in for." };
    }
    assignmentId = activeAssignments[0].id;
  }

  const assignment = await prisma.assignment.findFirst({
    where: { id: assignmentId, employeeId: user.id, active: true },
  });
  if (!assignment) {
    return { error: "Invalid assignment." };
  }

  // Stored as a universal instant; rendered in Philippine time everywhere
  // (see APP_TIME_ZONE in src/lib/format.ts).
  await prisma.timeEntry.create({
    data: {
      employeeId: user.id,
      assignmentId: assignment.id,
      clockIn: new Date(),
    },
  });

  revalidatePath("/employee");
  return undefined;
}

export async function clockOutAction(
  _prevState: TimeEntryActionState
): Promise<TimeEntryActionState> {
  const user = await requireUser("EMPLOYEE", "MANAGER");

  const openEntry = await prisma.timeEntry.findFirst({
    where: { employeeId: user.id, clockOut: null },
    orderBy: { clockIn: "desc" },
  });
  if (!openEntry) {
    return { error: "You are not currently clocked in." };
  }

  await prisma.timeEntry.update({
    where: { id: openEntry.id },
    data: { clockOut: new Date() },
  });

  revalidatePath("/employee");
  return undefined;
}
