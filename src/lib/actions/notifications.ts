"use server";

import bcrypt from "bcryptjs";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { getCompanySettings } from "@/lib/company";
import { computePayslipsForPeriod } from "@/lib/payslip";
import {
  appUrl,
  emailConfigured,
  sendEmail,
} from "@/lib/email/send";
import { inviteEmail, payslipReadyEmail } from "@/lib/email/templates";
import type { EmailKind, Prisma } from "@/generated/prisma/client";

const DEFAULT_PASSWORD = "password123";

export type NotifyState =
  | { error?: string; ok?: string; sent?: number; failed?: number }
  | undefined;

type Recipient = {
  id: string;
  name: string;
  username: string;
  email: string;
  mustChangePassword: boolean;
};

async function activeRecipients(): Promise<Recipient[]> {
  const users = await prisma.user.findMany({
    where: { active: true, role: { in: ["EMPLOYEE", "MANAGER"] } },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      mustChangePassword: true,
    },
  });
  return users.filter((u) => u.email && u.email.includes("@")) as Recipient[];
}

async function logAndSend(params: {
  kind: EmailKind;
  recipient: Recipient;
  subject: string;
  text: string;
  html: string;
  sentById: string;
  meta?: Prisma.InputJsonValue;
}): Promise<boolean> {
  const { kind, recipient, subject, text, html, sentById, meta } = params;
  try {
    await sendEmail({ to: recipient.email, subject, text, html });
    await prisma.emailLog.create({
      data: {
        kind,
        recipientId: recipient.id,
        recipientEmail: recipient.email,
        subject,
        status: "SENT",
        sentById,
        meta: meta ?? undefined,
      },
    });
    return true;
  } catch (err) {
    await prisma.emailLog.create({
      data: {
        kind,
        recipientId: recipient.id,
        recipientEmail: recipient.email,
        subject,
        status: "FAILED",
        error: err instanceof Error ? err.message : String(err),
        sentById,
        meta: meta ?? undefined,
      },
    });
    return false;
  }
}

/**
 * Email every active employee/manager that an account exists for them.
 * People who still have the default password get their username + the default
 * password (their hash is reset first so the emailed value is guaranteed
 * correct). People who have already onboarded get their username only.
 */
export async function sendAccountInvitesAction(
  _prev: NotifyState,
  formData: FormData
): Promise<NotifyState> {
  void formData; // no inputs — the button just triggers the send
  const admin = await requireUser("ADMIN");
  if (!emailConfigured()) {
    return {
      error:
        "Email is not configured on the server. Add SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS to the environment.",
    };
  }

  const company = await getCompanySettings();
  const loginUrl = `${appUrl()}/login`;
  const recipients = await activeRecipients();
  if (recipients.length === 0) {
    return { error: "No active members with an email address were found." };
  }

  const defaultHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  let sent = 0;
  let failed = 0;
  for (const r of recipients) {
    if (r.mustChangePassword) {
      // Guarantee the credentials we email actually work.
      await prisma.user.update({
        where: { id: r.id },
        data: { passwordHash: defaultHash, mustChangePassword: true },
      });
    }
    const mail = inviteEmail({
      companyName: company.name,
      loginUrl,
      recipientName: r.name,
      username: r.username,
      password: r.mustChangePassword ? DEFAULT_PASSWORD : undefined,
    });
    const ok = await logAndSend({
      kind: "ACCOUNT_INVITE",
      recipient: r,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      sentById: admin.id,
    });
    if (ok) sent++;
    else failed++;
  }

  return {
    sent,
    failed,
    ok: `Account invites sent to ${sent} member${sent === 1 ? "" : "s"}${
      failed > 0 ? `; ${failed} failed` : ""
    }.`,
  };
}

/**
 * Email every active employee/manager who has a payslip in the given closed
 * pay period that it is now available.
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
    const ok = await logAndSend({
      kind: "PAYSLIP_READY",
      recipient: r,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      sentById: admin.id,
      meta: { payPeriodId, periodLabel: batch.periodLabel },
    });
    if (ok) sent++;
    else failed++;
  }

  return {
    sent,
    failed,
    ok: `Payslip notifications sent to ${sent} member${
      sent === 1 ? "" : "s"
    }${failed > 0 ? `; ${failed} failed` : ""}.`,
  };
}
