"use client";

import { useActionState } from "react";
import { Button, ErrorText } from "@/components/ui";
import { sendAccountInvitesAction } from "@/lib/actions/notifications";

export function SendInvitesButton({ count }: { count: number }) {
  const [state, formAction, pending] = useActionState(
    sendAccountInvitesAction,
    undefined
  );

  return (
    <form
      action={formAction}
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        if (
          !window.confirm(
            `Send an account invite email to all ${count} active member${
              count === 1 ? "" : "s"
            } with an email address?\n\nMembers who have not logged in yet will receive their username and default password.`
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <div className="flex items-center gap-3">
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Sending…" : "Email account invites"}
        </Button>
        {state?.ok && (
          <span className="text-sm text-green-700 dark:text-green-400">
            {state.ok}
          </span>
        )}
      </div>
      <ErrorText>{state?.error}</ErrorText>
    </form>
  );
}
