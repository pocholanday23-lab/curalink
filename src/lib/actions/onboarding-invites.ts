"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { generateUsername } from "@/lib/username";
import { generateOnboardingToken, ONBOARDING_INVITE_TTL_MS } from "@/lib/onboarding-token";
import { getCompanySettings } from "@/lib/company";
import { appUrl, emailConfigured, sendEmail } from "@/lib/email/send";
import { onboardingInviteEmail } from "@/lib/email/templates";
import { DEFAULT_PASSWORD, sendAccountInvites } from "@/lib/email/invite";
import {
  str,
  readProfileScalars,
  readDependents,
  saveProfile,
  revalidateDirectories,
} from "@/lib/hr-profile";

export type OnboardingActionState =
  | { error?: string; ok?: string }
  | undefined;

function directoryPath(role: string) {
  return role === "ADMIN" ? "/admin/employees" : "/manager/directory";
}

async function deliverInvite(invite: {
  id: string;
  token: string;
  email: string;
  managerId: string | null;
  invitedById: string;
}) {
  const [company, manager] = await Promise.all([
    getCompanySettings(),
    invite.managerId
      ? prisma.user.findUnique({
          where: { id: invite.managerId },
          select: { name: true },
        })
      : Promise.resolve(null),
  ]);

  const formUrl = `${appUrl()}/onboard/${invite.token}`;
  const mail = onboardingInviteEmail({
    companyName: company.name,
    formUrl,
    managerName: manager?.name ?? null,
  });

  let status = "SENT";
  let error: string | undefined;
  try {
    await sendEmail({
      to: invite.email,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    });
  } catch (err) {
    status = "FAILED";
    error = err instanceof Error ? err.message : String(err);
  }

  await prisma.emailLog.create({
    data: {
      kind: "ONBOARDING_INVITE",
      recipientEmail: invite.email,
      subject: mail.subject,
      status,
      error,
      sentById: invite.invitedById,
      meta: { onboardingInviteId: invite.id },
    },
  });

  return status === "SENT";
}

/**
 * Admin or manager: invite a prospective employee, by email only, to fill in
 * their own HR record. A manager's invite is always assigned to themselves;
 * an admin may assign it to any manager or leave it unassigned.
 */
export async function sendOnboardingInviteAction(
  _prev: OnboardingActionState,
  formData: FormData
): Promise<OnboardingActionState> {
  const actor = await requireUser("ADMIN", "MANAGER");

  if (!emailConfigured()) {
    return {
      error:
        "Email is not configured on the server. Add SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS to the environment.",
    };
  }

  const email = str(formData, "email")?.toLowerCase();
  if (!email || !email.includes("@")) {
    return { error: "Enter a valid email address." };
  }

  const managerId =
    actor.role === "MANAGER" ? actor.id : str(formData, "managerId");

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return { error: `An account with the email ${email} already exists.` };
  }

  const pending = await prisma.onboardingInvite.findFirst({
    where: { email, completedAt: null },
  });
  if (pending) {
    return {
      error:
        "A sign-up invite is already pending for this email. Resend or cancel it below instead of sending another.",
    };
  }

  const invite = await prisma.onboardingInvite.create({
    data: {
      token: generateOnboardingToken(),
      email,
      managerId: managerId || null,
      invitedById: actor.id,
      expiresAt: new Date(Date.now() + ONBOARDING_INVITE_TTL_MS),
    },
  });

  const sent = await deliverInvite(invite);

  revalidatePath(directoryPath(actor.role));

  if (!sent) {
    return { error: `Could not send the sign-up email to ${email}. Try resending it below.` };
  }
  return { ok: `Sign-up invite sent to ${email}.` };
}

async function loadInviteForActor(id: string) {
  const actor = await requireUser("ADMIN", "MANAGER");
  const invite = await prisma.onboardingInvite.findUnique({ where: { id } });
  if (!invite) return null;
  if (actor.role === "MANAGER" && invite.invitedById !== actor.id) return null;
  return { actor, invite };
}

/** Resend a still-pending invite with a fresh token and expiry. */
export async function resendOnboardingInviteAction(id: string): Promise<void> {
  const found = await loadInviteForActor(id);
  if (!found || found.invite.completedAt) return;

  const invite = await prisma.onboardingInvite.update({
    where: { id },
    data: {
      token: generateOnboardingToken(),
      expiresAt: new Date(Date.now() + ONBOARDING_INVITE_TTL_MS),
    },
  });

  await deliverInvite(invite);
  revalidatePath(directoryPath(found.actor.role));
}

/** Cancel a pending invite so the email can be invited again. */
export async function cancelOnboardingInviteAction(id: string): Promise<void> {
  const found = await loadInviteForActor(id);
  if (!found || found.invite.completedAt) return;

  await prisma.onboardingInvite.delete({ where: { id } });
  revalidatePath(directoryPath(found.actor.role));
}

/**
 * The new hire submits their own HR record from the emailed link. No
 * session is required — the token is the only credential. Manager and pay
 * are never collected here; manager comes from the invite, pay is left for
 * an admin to fill in later.
 */
export async function completeOnboardingAction(
  token: string,
  _prev: OnboardingActionState,
  formData: FormData
): Promise<OnboardingActionState> {
  const invite = await prisma.onboardingInvite.findUnique({ where: { token } });
  if (!invite) return { error: "This sign-up link isn't valid." };
  if (invite.completedAt) {
    return { error: "This sign-up link has already been used." };
  }
  if (invite.expiresAt.getTime() < Date.now()) {
    return {
      error:
        "This sign-up link has expired. Ask your manager or HR to send a new one.",
    };
  }

  const firstName = str(formData, "firstName");
  const lastName = str(formData, "lastName");
  if (!firstName || !lastName) {
    return { error: "First name and last name are required." };
  }

  const emailClash = await prisma.user.findUnique({
    where: { email: invite.email },
  });
  if (emailClash) {
    return {
      error: "An account already exists for this email. Contact HR for help.",
    };
  }

  const username = await generateUsername(firstName, lastName);
  const scalars = readProfileScalars(formData, { includePay: false });
  const dependents = readDependents(formData);

  const created = await prisma.user.create({
    data: {
      name: `${firstName} ${lastName}`,
      firstName,
      lastName,
      username,
      email: invite.email,
      passwordHash: await bcrypt.hash(DEFAULT_PASSWORD, 10),
      mustChangePassword: true,
      role: "EMPLOYEE",
      managerId: invite.managerId,
    },
  });

  await saveProfile(created.id, scalars, dependents);

  await prisma.onboardingInvite.update({
    where: { id: invite.id },
    data: { completedAt: new Date(), completedUserId: created.id },
  });

  // Fire-and-forget: send their username and default password.
  void sendAccountInvites([created], invite.invitedById);

  revalidateDirectories();
  redirect(`/onboard/${token}`);
}
