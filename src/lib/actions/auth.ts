"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { getSessionUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

export async function loginAction(
  _prevState: string | undefined,
  formData: FormData
) {
  try {
    await signIn("credentials", {
      username: formData.get("username"),
      password: formData.get("password"),
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return "Invalid username or password.";
    }
    throw error;
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}

export type ChangePasswordState = { error?: string } | undefined;

export async function changePasswordAction(
  _prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return { error: "Your session has expired. Please sign in again." };
  }

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!currentPassword || !newPassword) {
    return { error: "All fields are required." };
  }
  if (newPassword.length < 8) {
    return { error: "New password must be at least 8 characters." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "New password and confirmation do not match." };
  }

  const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
  if (!user) {
    return { error: "Account not found." };
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    return { error: "Current password is incorrect." };
  }
  if (currentPassword === newPassword) {
    return { error: "New password must be different from the current one." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await bcrypt.hash(newPassword, 10),
      mustChangePassword: false,
    },
  });

  await signOut({ redirectTo: "/login?changed=1" });
}
