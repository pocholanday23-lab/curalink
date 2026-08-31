"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/actions/auth";
import { Button, ErrorText, Field, Input } from "@/components/ui";

export function LoginForm() {
  const [error, action, pending] = useActionState(loginAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <ErrorText>{error}</ErrorText>
      <Field label="Username" htmlFor="username">
        <Input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
        />
      </Field>
      <Field label="Password" htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </Field>
      <Button type="submit" disabled={pending} className="mt-2 w-full">
        {pending ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
