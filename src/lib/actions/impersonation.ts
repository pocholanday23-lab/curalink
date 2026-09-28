"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { getSessionUser, requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { signImpersonationToken } from "@/lib/impersonation-token";

const ROLE_HOME: Record<string, string> = {
  EMPLOYEE: "/employee",
  MANAGER: "/manager/directory",
  ADMIN: "/admin",
};

const TOKEN_TTL_SECONDS = 120;

export async function startImpersonationAction(userId: string) {
  const admin = await requireUser("ADMIN");

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (
    !target ||
    !target.active ||
    target.role === "ADMIN" ||
    target.id === admin.id
  ) {
    redirect("/admin/employees");
  }

  const token = signImpersonationToken({
    sub: target.id,
    by: admin.id,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  });

  try {
    await signIn("impersonate", {
      token,
      redirectTo: ROLE_HOME[target.role] ?? "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/admin/employees?impersonate=failed");
    }
    throw error;
  }
}

/**
 * Restores the admin's own session (no redirect — this is invoked from a
 * client click handler in a tab opened by "Log in as", which closes the tab
 * itself afterward rather than navigating it anywhere).
 */
export async function stopImpersonationAction(): Promise<{ ok: boolean }> {
  const user = await getSessionUser();
  const adminId = user?.impersonatorId;
  if (!adminId) {
    return { ok: false };
  }

  const token = signImpersonationToken({
    sub: adminId,
    by: null,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  });

  try {
    await signIn("impersonate", { token, redirect: false });
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false };
    }
    throw error;
  }
}
