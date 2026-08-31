import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Base username: first letter of the first name + the last name, lowercased,
 * with every non-alphanumeric character removed.
 *   "Shirleen Joyce" + "Macatangay" -> "smacatangay"
 */
export function usernameBase(firstName: string, lastName: string): string {
  const first = firstName.trim().charAt(0);
  const combined = `${first}${lastName}`.toLowerCase().replace(/[^a-z0-9]/g, "");
  return combined || "user";
}

/**
 * Returns `base` if it is free, otherwise `base2`, `base3`, ... — the first
 * value not present in `taken`. The chosen value is added to `taken` so the
 * same set can be threaded through a batch of generations.
 */
export function nextUsername(base: string, taken: Set<string>): string {
  let candidate = base;
  let n = 2;
  while (taken.has(candidate)) {
    candidate = `${base}${n}`;
    n += 1;
  }
  taken.add(candidate);
  return candidate;
}

/** Async single-shot generator that checks existing usernames in the database. */
export async function generateUsername(
  firstName: string,
  lastName: string
): Promise<string> {
  const existing = await prisma.user.findMany({ select: { username: true } });
  const taken = new Set(existing.map((u) => u.username));
  return nextUsername(usernameBase(firstName, lastName), taken);
}
