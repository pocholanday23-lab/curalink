import "server-only";
import nodemailer from "nodemailer";

/**
 * SMTP transport for outbound mail (account invites, payslip-ready notices).
 *
 * Configure with these env vars (see deploy/.env.example):
 *   SMTP_HOST   e.g. smtp.hostinger.com
 *   SMTP_PORT   465 (SSL) or 587 (STARTTLS)
 *   SMTP_USER   the full mailbox address, e.g. poch@curalink.pro
 *   SMTP_PASS   the mailbox password
 *   EMAIL_FROM  optional display From, e.g. "Curalink HR <poch@curalink.pro>"
 *               (falls back to SMTP_USER)
 */

const host = process.env.SMTP_HOST?.trim();
const port = Number(process.env.SMTP_PORT ?? 465);
const user = process.env.SMTP_USER?.trim();
const pass = process.env.SMTP_PASS;

export function emailConfigured(): boolean {
  return Boolean(host && user && pass);
}

export function emailFrom(): string {
  return process.env.EMAIL_FROM?.trim() || user || "no-reply@localhost";
}

/** Best-effort base URL for login links in emails. */
export function appUrl(): string {
  return (
    process.env.AUTH_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    "http://localhost:3000"
  ).replace(/\/+$/, "");
}

let cached: nodemailer.Transporter | null = null;

function transport(): nodemailer.Transporter {
  if (!emailConfigured()) {
    throw new Error(
      "Email is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS."
    );
  }
  if (!cached) {
    cached = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user: user as string, pass: pass as string },
    });
  }
  return cached;
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<void> {
  await transport().sendMail({
    from: emailFrom(),
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
  });
}
