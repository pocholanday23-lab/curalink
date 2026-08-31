import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { Role } from "@/generated/prisma/client";

export async function getSessionUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireUser(...allowedRoles: Role[]) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    redirect("/login");
  }
  return user;
}
