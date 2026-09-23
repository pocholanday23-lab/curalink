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
import {
  onboardingInviteEmail,
  onboardingSubmittedEmail,
  onboardingContractEmail,
} from "@/lib/email/templates";
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
  const company = await getCompanySettings();

  const formUrl = `${appUrl()}/onboard/${invite.token}`;
  const mail = onboardingInviteEmail({
    companyName: company.name,
    formUrl,
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
  if (
    actor.role === "MANAGER" &&
    invite.invitedById !== actor.id &&
    invite.managerId !== actor.id
  ) {
    return null;
  }
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
      // Held inactive until an admin/manager reviews the sign-up and
      // activates it — this is the audit gate before anyone can log in.
      active: false,
    },
  });

  await saveProfile(created.id, scalars, dependents);

  await prisma.onboardingInvite.update({
    where: { id: invite.id },
    data: { completedAt: new Date(), completedUserId: created.id },
  });

  // Fire-and-forget: tell the reviewers (admin + assigned manager) a sign-up
  // is waiting. Credentials are emailed later, only once activated.
  void notifyReviewers(invite.id);

  revalidateDirectories();
  redirect(`/onboard/${token}`);
}

/** Everyone who should review a submitted sign-up: all admins + the assigned manager. */
async function reviewersFor(managerId: string | null) {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", active: true },
    select: { id: true, name: true, email: true, role: true },
  });
  const manager = managerId
    ? await prisma.user.findUnique({
        where: { id: managerId },
        select: { id: true, name: true, email: true, role: true },
      })
    : null;

  const byId = new Map(admins.map((u) => [u.id, u]));
  if (manager) byId.set(manager.id, manager);
  return [...byId.values()];
}

async function notifyReviewers(inviteId: string) {
  try {
    const invite = await prisma.onboardingInvite.findUnique({
      where: { id: inviteId },
      include: { completedUser: { select: { name: true, email: true } } },
    });
    if (!invite || !invite.completedUser) return;

    const [company, reviewers] = await Promise.all([
      getCompanySettings(),
      reviewersFor(invite.managerId),
    ]);

    for (const reviewer of reviewers) {
      const reviewUrl = `${appUrl()}${
        reviewer.role === "ADMIN"
          ? `/admin/employees/onboarding/${invite.id}`
          : `/manager/directory/onboarding/${invite.id}`
      }`;
      const mail = onboardingSubmittedEmail({
        companyName: company.name,
        reviewerName: reviewer.name,
        employeeName: invite.completedUser.name,
        employeeEmail: invite.completedUser.email,
        reviewUrl,
      });
      try {
        await sendEmail({
          to: reviewer.email,
          subject: mail.subject,
          text: mail.text,
          html: mail.html,
        });
        await prisma.emailLog.create({
          data: {
            kind: "ONBOARDING_INVITE",
            recipientId: reviewer.id,
            recipientEmail: reviewer.email,
            subject: mail.subject,
            status: "SENT",
            meta: { onboardingInviteId: invite.id, purpose: "review-notice" },
          },
        });
      } catch (err) {
        await prisma.emailLog.create({
          data: {
            kind: "ONBOARDING_INVITE",
            recipientId: reviewer.id,
            recipientEmail: reviewer.email,
            subject: mail.subject,
            status: "FAILED",
            error: err instanceof Error ? err.message : String(err),
            meta: { onboardingInviteId: invite.id, purpose: "review-notice" },
          },
        });
      }
    }
  } catch (err) {
    console.error("notifyReviewers failed", err);
  }
}

/**
 * Admin or manager: after reviewing a submitted sign-up, assign a
 * client/project and salary, then send the new hire their contract.
 */
export async function confirmOnboardingAction(
  id: string,
  _prev: OnboardingActionState,
  formData: FormData
): Promise<OnboardingActionState> {
  if (!emailConfigured()) {
    return {
      error:
        "Email is not configured on the server. Add SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS to the environment.",
    };
  }

  const found = await loadInviteForActor(id);
  if (!found) return { error: "Sign-up not found." };
  const { actor, invite } = found;

  if (!invite.completedAt || !invite.completedUserId) {
    return { error: "This person hasn't submitted their sign-up yet." };
  }
  if (invite.confirmedAt) {
    return { error: "This sign-up has already been confirmed." };
  }

  const clientId = str(formData, "clientId");
  if (!clientId) return { error: "Select a client to assign them to." };

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) return { error: "That client no longer exists." };

  const salaryPhpRaw = str(formData, "salaryPhp");
  const salaryPhp = salaryPhpRaw ? Number(salaryPhpRaw) : null;
  if (!salaryPhp || !Number.isFinite(salaryPhp) || salaryPhp <= 0) {
    return { error: "Enter a valid PHP salary." };
  }
  const salaryUsdRaw = str(formData, "salaryUsd");
  const salaryUsd =
    salaryUsdRaw && Number.isFinite(Number(salaryUsdRaw))
      ? Number(salaryUsdRaw)
      : null;

  const projectName = str(formData, "projectName");
  const sowNotes = str(formData, "sowNotes");
  const engagementStartRaw = str(formData, "engagementStart");
  const engagementEndRaw = str(formData, "engagementEnd");
  const engagementStart = engagementStartRaw
    ? new Date(engagementStartRaw)
    : new Date();
  const engagementEnd = engagementEndRaw ? new Date(engagementEndRaw) : null;

  await prisma.employeeProfile.update({
    where: { userId: invite.completedUserId },
    data: { salaryPhp, salaryUsd },
  });

  await prisma.assignment.create({
    data: {
      employeeId: invite.completedUserId,
      clientId,
      projectName,
      payRate: 0,
      billRate: 0,
      startDate: engagementStart,
    },
  });

  await prisma.onboardingInvite.update({
    where: { id },
    data: {
      confirmedAt: new Date(),
      confirmedById: actor.id,
      sowNotes,
      engagementStart,
      engagementEnd,
    },
  });

  const employee = await prisma.user.findUnique({
    where: { id: invite.completedUserId },
  });

  if (employee) {
    const company = await getCompanySettings();
    const contractUrl = `${appUrl()}/onboard/${invite.token}/contract`;
    const mail = onboardingContractEmail({
      companyName: company.name,
      recipientName: employee.name,
      contractUrl,
      replyToEmail: process.env.SMTP_USER?.trim() || "HR",
    });
    let status = "SENT";
    let error: string | undefined;
    try {
      await sendEmail({
        to: employee.email,
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
        recipientId: employee.id,
        recipientEmail: employee.email,
        subject: mail.subject,
        status,
        error,
        sentById: actor.id,
        meta: { onboardingInviteId: id, purpose: "contract" },
      },
    });
  }

  revalidatePath(directoryPath(actor.role));
  revalidatePath(`/admin/employees/onboarding/${id}`);
  revalidatePath(`/manager/directory/onboarding/${id}`);
  return { ok: "Confirmed. The contract has been emailed to the new hire." };
}

/**
 * Final step: activate the account (so it can log in) and email the new
 * hire their username and default password.
 */
export async function activateOnboardingInviteAction(id: string): Promise<void> {
  const found = await loadInviteForActor(id);
  if (!found) return;
  const { actor, invite } = found;
  if (!invite.confirmedAt || invite.activatedAt || !invite.completedUserId) {
    return;
  }

  const user = await prisma.user.update({
    where: { id: invite.completedUserId },
    data: { active: true },
  });

  await prisma.onboardingInvite.update({
    where: { id },
    data: { activatedAt: new Date(), activatedById: actor.id },
  });

  await sendAccountInvites([user], actor.id);

  revalidateDirectories();
  revalidatePath(directoryPath(actor.role));
  revalidatePath(`/admin/employees/onboarding/${id}`);
  revalidatePath(`/manager/directory/onboarding/${id}`);
}
