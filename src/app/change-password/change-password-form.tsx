"use client";

import { useActionState } from "react";
import { changePasswordAction } from "@/lib/actions/auth";
import { Button, ErrorText, Field, Input } from "@/components/ui";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(
    changePasswordAction,
    undefined
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <ErrorText>{state?.error}</ErrorText>
      <Field label="Current password" htmlFor="currentPassword">
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
        />
      </Field>
      <Field label="New password" htmlFor="newPassword">
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </Field>
      <Field label="Confirm new password" htmlFor="confirmPassword">
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </Field>
      <Button type="submit" disabled={pending} className="mt-2 w-full">
        {pending ? "Updating..." : "Update password"}
      </Button>
    </form>
  );
}
