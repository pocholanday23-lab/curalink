import "server-only";
import crypto from "crypto";

/** Opaque, unguessable token used as the sole "auth" for a sign-up link. */
export function generateOnboardingToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}

export const ONBOARDING_INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
