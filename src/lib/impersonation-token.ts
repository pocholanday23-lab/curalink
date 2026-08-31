import crypto from "crypto";

const SECRET = process.env.AUTH_SECRET ?? "";

export type ImpersonationPayload = {
  /** user id to become */
  sub: string;
  /** admin id doing the impersonation, or null when returning to self */
  by: string | null;
  /** unix seconds */
  exp: number;
};

/** Short-lived HMAC token handed to the "impersonate" credentials provider. */
export function signImpersonationToken(payload: ImpersonationPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto
    .createHmac("sha256", SECRET)
    .update(body)
    .digest("base64url");
  return `${body}.${sig}`;
}

export function verifyImpersonationToken(
  token: string
): { sub: string; by: string | null } | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;

  const expected = crypto
    .createHmac("sha256", SECRET)
    .update(body)
    .digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString()
    ) as ImpersonationPayload;
    if (
      typeof payload.sub !== "string" ||
      typeof payload.exp !== "number" ||
      payload.exp < Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return { sub: payload.sub, by: payload.by ?? null };
  } catch {
    return null;
  }
}
