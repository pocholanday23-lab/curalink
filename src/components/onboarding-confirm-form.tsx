"use client";

import { useActionState } from "react";
import {
  Button,
  ErrorText,
  Field,
  Input,
  Select,
  Textarea,
} from "@/components/ui";
import { confirmOnboardingAction } from "@/lib/actions/onboarding-invites";

export function OnboardingConfirmForm({
  inviteId,
  clients,
}: {
  inviteId: string;
  clients: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(
    confirmOnboardingAction.bind(null, inviteId),
    undefined
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <ErrorText>{state?.error}</ErrorText>
      {state?.ok && (
        <p className="text-sm text-green-700">{state.ok}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Client" htmlFor="clientId">
          <Select id="clientId" name="clientId" required defaultValue="">
            <option value="" disabled>
              Select client
            </option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Project name (optional)" htmlFor="projectName">
          <Input id="projectName" name="projectName" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Salary (PHP / month)" htmlFor="salaryPhp">
          <Input
            id="salaryPhp"
            name="salaryPhp"
            inputMode="decimal"
            required
          />
        </Field>
        <Field
          label="Salary (USD / month, optional — internal use only, never shown on the contract)"
          htmlFor="salaryUsd"
        >
          <Input id="salaryUsd" name="salaryUsd" inputMode="decimal" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Engagement start" htmlFor="engagementStart">
          <Input
            id="engagementStart"
            name="engagementStart"
            type="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
          />
        </Field>
        <Field label="Engagement end (optional)" htmlFor="engagementEnd">
          <Input id="engagementEnd" name="engagementEnd" type="date" />
        </Field>
      </div>

      <Field
        label="Statement of work (Annex A) — leave blank for the standard scope"
        htmlFor="sowNotes"
      >
        <Textarea
          id="sowNotes"
          name="sowNotes"
          rows={8}
          placeholder="Leave blank to use the standard LumberFi inbound sales scope (500 calls/week, 3 appointments/week). Type here only to describe a different engagement — it replaces the standard text on the contract exactly as typed."
        />
      </Field>

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Confirming..." : "Confirm & send contract"}
      </Button>
    </form>
  );
}
