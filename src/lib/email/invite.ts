import "server-only";
import { prisma } from "@/lib/prisma";
import { getCompanySettings } from "@/lib/company";
import { appUrl, emailConfigured, sendEmail } from "@/lib/email/send";
import { inviteEmail } from "@/lib/email/templates";

export const DEFAULT_PASSWORD = "password123";

export type NewAccount = {
  id: string;
  name: string;
  username: string;
  email: string;
};

/** Placeholder addresses the app invents when a person has no real email. */
function hasRealEmail(email: string): boolean {
  return (
    email.includes("@") &&
    !email.endsWith("@ahora.local") &&
    !email.endsWith("@imported.local")
  );
}

/**
 * Emails newly created accounts their username and default password.
 *
 * Meant to be called without `await` right after creating the users, so the
 * page isn't held up by SMTP. It never throws: a failed or skipped send is
 * recorded in EmailLog and the account is created regardless.
 */
export async function sendAccountInvites(
  accounts: NewAccount[],
  sentById: string
): Promise<void> {
  try {
    if (!emailConfigured()) return;
    const targets = accounts.filter((a) => hasRealEmail(a.email));
    if (targets.length === 0) return;

    const company = await getCompanySettings();
    const loginUrl = `${appUrl()}/login`;

    for (const account of targets) {
      const mail = inviteEmail({
        companyName: company.name,
        loginUrl,
        recipientName: account.name,
        username: account.username,
        password: DEFAULT_PASSWORD,
      });
      let status = "SENT";
      let error: string | undefined;
      try {
        await sendEmail({
          to: account.email,
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
          kind: "ACCOUNT_INVITE",
          recipientId: account.id,
          recipientEmail: account.email,
          subject: mail.subject,
          status,
          error,
          sentById,
        },
      });
    }
  } catch (err) {
    console.error("sendAccountInvites failed", err);
  }
}
