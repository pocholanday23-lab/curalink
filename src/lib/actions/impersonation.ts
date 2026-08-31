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

export async function stopImpersonationAction() {
  const user = await getSessionUser();
  const adminId = user?.impersonatorId;
  if (!adminId) {
    redirect("/");
  }

  const token = signImpersonationToken({
    sub: adminId,
    by: null,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  });

  try {
    await signIn("impersonate", {
      token,
      redirectTo: "/admin/employees",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login");
    }
    throw error;
  }
}
