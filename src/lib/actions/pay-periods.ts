"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { generateUpcomingPeriods } from "@/lib/pay-periods";
import type { CutoffType } from "@/generated/prisma/client";

export type CutoffActionState = { error?: string } | undefined;

export async function saveCutoffConfigAction(
  _prevState: CutoffActionState,
  formData: FormData
): Promise<CutoffActionState> {
  await requireUser("ADMIN");

  const type = formData.get("type") as CutoffType;
  const anchorDateRaw = formData.get("anchorDate") as string;
  const payDelayDays = Number(formData.get("payDelayDays") ?? 10);
  const periodLengthDays = Number(formData.get("periodLengthDays") ?? 30);

  if (!anchorDateRaw) {
    return { error: "Anchor date is required." };
  }

  const existing = await prisma.cutoffConfig.findFirst();
  const data = {
    type,
    anchorDate: new Date(anchorDateRaw),
    params: { payDelayDays, periodLengthDays },
  };

  if (existing) {
    await prisma.cutoffConfig.update({ where: { id: existing.id }, data });
  } else {
    await prisma.cutoffConfig.create({ data });
  }

  revalidatePath("/admin/pay-periods");
  return undefined;
}

export async function generatePeriodsAction(
  _prevState: CutoffActionState,
  formData: FormData
): Promise<CutoffActionState> {
  await requireUser("ADMIN");

  const count = Math.min(24, Math.max(1, Number(formData.get("count") ?? 3)));

  const config = await prisma.cutoffConfig.findFirst();
  if (!config) {
    return { error: "Configure the cut-off schedule first." };
  }

  const lastPeriod = await prisma.payPeriod.findFirst({
    orderBy: { startDate: "desc" },
  });

  const params = config.params as {
    payDelayDays?: number;
    periodLengthDays?: number;
  } | null;

  const periods = generateUpcomingPeriods(
    { type: config.type, anchorDate: config.anchorDate, params },
    count,
    lastPeriod?.startDate
  );

  await prisma.payPeriod.createMany({
    data: periods.map((p) => ({
      startDate: p.startDate,
      endDate: p.endDate,
      payDate: p.payDate,
    })),
    skipDuplicates: true,
  });

  revalidatePath("/admin/pay-periods");
  return undefined;
}

export async function closePeriodAction(payPeriodId: string) {
  await requireUser("ADMIN");
  await prisma.payPeriod.update({
    where: { id: payPeriodId },
    data: { status: "CLOSED" },
  });
  revalidatePath("/admin/pay-periods");
  revalidatePath("/admin/reports/payroll");
}

export async function reopenPeriodAction(payPeriodId: string) {
  await requireUser("ADMIN");
  await prisma.payPeriod.update({
    where: { id: payPeriodId },
    data: { status: "OPEN" },
  });
  revalidatePath("/admin/pay-periods");
  revalidatePath("/admin/reports");
}
