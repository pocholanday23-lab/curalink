"use server";

import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { getCompanySettings } from "@/lib/company";
import { computePayslipsForPeriod } from "@/lib/payslip";
import { appUrl, emailConfigured, sendEmail } from "@/lib/email/send";
import { payslipReadyEmail } from "@/lib/email/templates";

export type NotifyState =
  | { error?: string; ok?: string; sent?: number; failed?: number }
  | undefined;

type Recipient = { id: string; name: string; email: string };

async function activeRecipients(): Promise<Recipient[]> {
  const users = await prisma.user.findMany({
    where: { active: true, role: { in: ["EMPLOYEE", "MANAGER"] } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });
  return users.filter((u) => u.email && u.email.includes("@"));
}

/**
 * Email every active employee/manager who has a payslip in the given closed
 * pay period that it is now available. (Account invites are sent
 * automatically when a person is added — see src/lib/email/invite.ts.)
 */
export async function sendPayslipReadyAction(
  _prev: NotifyState,
  formData: FormData
): Promise<NotifyState> {
  const admin = await requireUser("ADMIN");
  if (!emailConfigured()) {
    return {
      error:
        "Email is not configured on the server. Add SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS to the environment.",
    };
  }

  const payPeriodId = String(formData.get("payPeriodId") ?? "").trim();
  if (!payPeriodId) {
    return { error: "Pick a pay period first." };
  }

  const period = await prisma.payPeriod.findUnique({ where: { id: payPeriodId } });
  if (!period) return { error: "That pay period no longer exists." };
  if (period.status !== "CLOSED") {
    return { error: "That pay period is still open. Close it first." };
  }

  const company = await getCompanySettings();
  const loginUrl = `${appUrl()}/login`;

  const batch = await computePayslipsForPeriod(payPeriodId);
  const withPayslip = new Set(batch.payslips.map((p) => p.employeeId));

  const recipients = (await activeRecipients()).filter((r) =>
    withPayslip.has(r.id)
  );
  if (recipients.length === 0) {
    return {
      error: "No active members with an email address have a payslip in that period.",
    };
  }

  let sent = 0;
  let failed = 0;
  for (const r of recipients) {
    const mail = payslipReadyEmail({
      companyName: company.name,
      loginUrl,
      recipientName: r.name,
      periodLabel: batch.periodLabel,
    });
    let status = "SENT";
    let error: string | undefined;
    try {
      await sendEmail({
        to: r.email,
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
      });
      sent++;
    } catch (err) {
      status = "FAILED";
      error = err instanceof Error ? err.message : String(err);
      failed++;
    }
    await prisma.emailLog.create({
      data: {
        kind: "PAYSLIP_READY",
        recipientId: r.id,
        recipientEmail: r.email,
        subject: mail.subject,
        status,
        error,
        sentById: admin.id,
        meta: { payPeriodId, periodLabel: batch.periodLabel },
      },
    });
  }

  return {
    sent,
    failed,
    ok: `Payslip notifications sent to ${sent} member${
      sent === 1 ? "" : "s"
    }${failed > 0 ? `; ${failed} failed` : ""}.`,
  };
}
