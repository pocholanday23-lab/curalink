"use client";

import { useActionState } from "react";
import { Button, ErrorText, Input } from "@/components/ui";
import { generatePeriodsAction } from "@/lib/actions/pay-periods";

export function GeneratePeriodsForm() {
  const [state, formAction, pending] = useActionState(
    generatePeriodsAction,
    undefined
  );

  return (
    <form action={formAction} className="flex items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="count" className="text-sm font-medium">
          Generate next
        </label>
        <Input
          id="count"
          name="count"
          type="number"
          min="1"
          max="24"
          defaultValue={3}
          className="w-24"
        />
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Generating..." : "Generate periods"}
      </Button>
      {state?.error && <ErrorText>{state.error}</ErrorText>}
    </form>
  );
}
