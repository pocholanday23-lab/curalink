import "server-only";

export type BuiltEmail = { subject: string; text: string; html: string };

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function shell(bodyHtml: string, companyName: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f5f7;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:10px;overflow:hidden;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
            <tr>
              <td style="background:#1f52ad;color:#ffffff;padding:18px 28px;font-size:16px;font-weight:600;">
                ${esc(companyName)}
              </td>
            </tr>
            <tr>
              <td style="padding:28px;color:#1f2937;font-size:14px;line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px;color:#6b7280;font-size:12px;border-top:1px solid #e5e7eb;">
                This is an automated message from ${esc(companyName)} HR. Please do not reply to this email.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function button(url: string, label: string): string {
  return `<p style="margin:24px 0;">
    <a href="${esc(url)}" style="background:#1f52ad;color:#ffffff;text-decoration:none;padding:11px 22px;border-radius:8px;font-weight:600;display:inline-block;">${esc(
      label
    )}</a>
  </p>`;
}

export function inviteEmail(opts: {
  companyName: string;
  loginUrl: string;
  recipientName: string;
  username: string;
  /** Present only when the account still has the default password. */
  password?: string;
}): BuiltEmail {
  const { companyName, loginUrl, recipientName, username, password } = opts;
  const first = recipientName.split(" ")[0] || recipientName;
  const subject = `Your ${companyName} account is ready`;

  const credsText = password
    ? `Username: ${username}\nTemporary password: ${password}\n\nYou will be asked to set a new password the first time you sign in.`
    : `Username: ${username}\n\nUse the password you set previously. If you have forgotten it, contact HR.`;

  const text = `Hi ${first},

An account has been created for you on the ${companyName} HR portal, where you can clock in and out, view your payslips, and keep your profile up to date.

${credsText}

Sign in here: ${loginUrl}

- ${companyName} HR`;

  const credsHtml = password
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;border-collapse:collapse;">
         <tr><td style="padding:6px 14px;background:#f3f4f6;border:1px solid #e5e7eb;">Username</td><td style="padding:6px 14px;border:1px solid #e5e7eb;font-family:monospace;"><strong>${esc(
           username
         )}</strong></td></tr>
         <tr><td style="padding:6px 14px;background:#f3f4f6;border:1px solid #e5e7eb;">Temporary password</td><td style="padding:6px 14px;border:1px solid #e5e7eb;font-family:monospace;"><strong>${esc(
           password
         )}</strong></td></tr>
       </table>
       <p style="margin:8px 0 0;color:#6b7280;font-size:13px;">You will be asked to set a new password the first time you sign in.</p>`
    : `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;border-collapse:collapse;">
         <tr><td style="padding:6px 14px;background:#f3f4f6;border:1px solid #e5e7eb;">Username</td><td style="padding:6px 14px;border:1px solid #e5e7eb;font-family:monospace;"><strong>${esc(
           username
         )}</strong></td></tr>
       </table>
       <p style="margin:8px 0 0;color:#6b7280;font-size:13px;">Use the password you set previously. If you have forgotten it, contact HR.</p>`;

  const html = shell(
    `<p style="margin:0 0 12px;">Hi ${esc(first)},</p>
     <p style="margin:0 0 12px;">An account has been created for you on the ${esc(
       companyName
     )} HR portal, where you can clock in and out, view your payslips, and keep your profile up to date.</p>
     ${credsHtml}
     ${button(loginUrl, "Sign in to the HR portal")}
     <p style="margin:0;color:#6b7280;font-size:13px;">Or paste this link into your browser:<br><a href="${esc(
       loginUrl
     )}" style="color:#1f52ad;">${esc(loginUrl)}</a></p>`,
    companyName
  );

  return { subject, text, html };
}

export function payslipReadyEmail(opts: {
  companyName: string;
  loginUrl: string;
  recipientName: string;
  periodLabel: string;
}): BuiltEmail {
  const { companyName, loginUrl, recipientName, periodLabel } = opts;
  const first = recipientName.split(" ")[0] || recipientName;
  const subject = `Your payslip for ${periodLabel} is ready`;

  const text = `Hi ${first},

Your payslip for the pay period ${periodLabel} is now available on the ${companyName} HR portal.

Sign in to view and download it: ${loginUrl}

- ${companyName} HR`;

  const html = shell(
    `<p style="margin:0 0 12px;">Hi ${esc(first)},</p>
     <p style="margin:0 0 12px;">Your payslip for the pay period <strong>${esc(
       periodLabel
     )}</strong> is now available on the ${esc(
       companyName
     )} HR portal.</p>
     ${button(loginUrl, "View my payslip")}
     <p style="margin:0;color:#6b7280;font-size:13px;">Or paste this link into your browser:<br><a href="${esc(
       loginUrl
     )}" style="color:#1f52ad;">${esc(loginUrl)}</a></p>`,
    companyName
  );

  return { subject, text, html };
}

export function onboardingInviteEmail(opts: {
  companyName: string;
  formUrl: string;
  managerName?: string | null;
}): BuiltEmail {
  const { companyName, formUrl, managerName } = opts;
  const subject = `Welcome to ${companyName} — please complete your sign-up`;

  const managerLine = managerName
    ? `You'll be reporting to ${managerName}.`
    : "";

  const text = `Welcome to ${companyName}!

To finish setting up your HR record, please fill out this short sign-up form:
${formUrl}

${managerLine}

This link is personal to you and expires in 7 days. Once you submit it, we'll
email you a username and password so you can sign in to the HR portal.

- ${companyName} HR`;

  const html = shell(
    `<p style="margin:0 0 12px;">Welcome to ${esc(companyName)}!</p>
     <p style="margin:0 0 12px;">To finish setting up your HR record, please fill out this short sign-up form.${
       managerLine ? ` ${esc(managerLine)}` : ""
     }</p>
     ${button(formUrl, "Complete sign-up")}
     <p style="margin:0 0 12px;color:#6b7280;font-size:13px;">Or paste this link into your browser:<br><a href="${esc(
       formUrl
     )}" style="color:#1f52ad;">${esc(formUrl)}</a></p>
     <p style="margin:0;color:#6b7280;font-size:13px;">This link is personal to you and expires in 7 days. Once you submit it, we'll email you a username and password so you can sign in.</p>`,
    companyName
  );

  return { subject, text, html };
}

export function onboardingSubmittedEmail(opts: {
  companyName: string;
  reviewerName: string;
  employeeName: string;
  employeeEmail: string;
  reviewUrl: string;
}): BuiltEmail {
  const { companyName, reviewerName, employeeName, employeeEmail, reviewUrl } = opts;
  const first = reviewerName.split(" ")[0] || reviewerName;
  const subject = `New sign-up to review: ${employeeName}`;

  const text = `Hi ${first},

${employeeName} (${employeeEmail}) just completed their sign-up form on the
${companyName} HR portal.

Please review it, assign them to a client/project, and set their salary. Once
you confirm, they'll be emailed a contract to sign.

Review it here: ${reviewUrl}

- ${companyName} HR`;

  const html = shell(
    `<p style="margin:0 0 12px;">Hi ${esc(first)},</p>
     <p style="margin:0 0 12px;"><strong>${esc(employeeName)}</strong> (${esc(
       employeeEmail
     )}) just completed their sign-up form on the ${esc(companyName)} HR portal.</p>
     <p style="margin:0 0 12px;">Please review it, assign them to a client/project, and set their salary. Once you confirm, they'll be emailed a contract to sign.</p>
     ${button(reviewUrl, "Review sign-up")}
     <p style="margin:0;color:#6b7280;font-size:13px;">Or paste this link into your browser:<br><a href="${esc(
       reviewUrl
     )}" style="color:#1f52ad;">${esc(reviewUrl)}</a></p>`,
    companyName
  );

  return { subject, text, html };
}

export function onboardingContractEmail(opts: {
  companyName: string;
  recipientName: string;
  contractUrl: string;
  replyToEmail: string;
}): BuiltEmail {
  const { companyName, recipientName, contractUrl, replyToEmail } = opts;
  const first = recipientName.split(" ")[0] || recipientName;
  const subject = `Welcome to ${companyName} — please sign your contract`;

  const text = `Hi ${first},

Welcome to ${companyName}! Your sign-up has been reviewed and confirmed.

Please view and print your Independent Contractor Agreement here:
${contractUrl}

Review it, sign it, and reply to this email with a scanned or photographed
copy of the signed contract as a PDF attachment (to ${replyToEmail}).

Once we receive your signed contract, we'll activate your account and send
you your login details.

- ${companyName} HR`;

  const html = shell(
    `<p style="margin:0 0 12px;">Hi ${esc(first)},</p>
     <p style="margin:0 0 12px;">Welcome to ${esc(
       companyName
     )}! Your sign-up has been reviewed and confirmed.</p>
     ${button(contractUrl, "View my contract")}
     <p style="margin:0 0 12px;">Please review it, sign it, and <strong>reply to this email</strong> with a scanned or photographed copy of the signed contract as a PDF attachment (to ${esc(
       replyToEmail
     )}).</p>
     <p style="margin:0;color:#6b7280;font-size:13px;">Once we receive your signed contract, we'll activate your account and send you your login details.</p>`,
    companyName
  );

  return { subject, text, html };
}
