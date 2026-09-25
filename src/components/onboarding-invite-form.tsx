"use client";

import { useActionState } from "react";
import { Button, ErrorText, Field, Input, Select } from "@/components/ui";
import { sendOnboardingInviteAction } from "@/lib/actions/onboarding-invites";

export function OnboardingInviteForm({
  managers,
}: {
  /** Omit for a manager (their invites always assign to themselves). */
  managers?: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(
    sendOnboardingInviteAction,
    undefined
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <ErrorText>{state?.error}</ErrorText>
      {state?.ok && (
        <p className="text-sm text-green-700">{state.ok}</p>
      )}
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-[16rem] flex-1">
          <Field label="Email address" htmlFor="invite-email">
            <Input id="invite-email" name="email" type="email" required />
          </Field>
        </div>
        {managers && managers.length > 0 && (
          <div className="min-w-[12rem]">
            <Field label="Manager" htmlFor="invite-managerId">
              <Select id="invite-managerId" name="managerId" defaultValue="">
                <option value="">No manager</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? "Sending..." : "Send sign-up link"}
        </Button>
      </div>
      <p className="text-xs opacity-70">
        They&apos;ll get an email with a link to fill in their own details —
        manager and salary aren&apos;t part of that form. Once they submit it,
        their account is created and they&apos;re emailed a username and
        password.
      </p>
    </form>
  );
}
