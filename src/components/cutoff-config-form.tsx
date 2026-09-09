"use client";

import { useActionState, useState } from "react";
import { Button, ErrorText, Field, Input, Select } from "@/components/ui";
import {
  saveCutoffConfigAction,
  type CutoffActionState,
} from "@/lib/actions/pay-periods";

export function CutoffConfigForm({
  defaultValues,
}: {
  defaultValues?: {
    type: string;
    anchorDate: Date;
    payDelayDays: number;
    periodLengthDays: number;
  };
}) {
  const [state, formAction, pending] = useActionState<
    CutoffActionState,
    FormData
  >(saveCutoffConfigAction, undefined);
  const [type, setType] = useState(defaultValues?.type ?? "SEMI_MONTHLY");

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <ErrorText>{state?.error}</ErrorText>
      <Field label="Cut-off type" htmlFor="type">
        <Select
          id="type"
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="SEMI_MONTHLY">Semi-monthly (1–15, 16–end)</option>
          <option value="BIWEEKLY">Biweekly (14 days)</option>
          <option value="WEEKLY">Weekly (7 days)</option>
          <option value="CUSTOM">Custom period length</option>
        </Select>
      </Field>
      <Field
        label="Anchor date"
        htmlFor="anchorDate"
        error={undefined}
      >
        <Input
          id="anchorDate"
          name="anchorDate"
          type="date"
          required
          defaultValue={
            defaultValues
              ? new Date(defaultValues.anchorDate).toISOString().slice(0, 10)
              : ""
          }
        />
        <p className="text-xs text-black/50 dark:text-white/50">
          {type === "SEMI_MONTHLY"
            ? "Any date — periods always run 1st–15th and 16th–end of month."
            : "The start date of the first period."}
        </p>
      </Field>
      {type === "CUSTOM" && (
        <Field label="Period length (days)" htmlFor="periodLengthDays">
          <Input
            id="periodLengthDays"
            name="periodLengthDays"
            type="number"
            min="1"
            defaultValue={defaultValues?.periodLengthDays ?? 30}
          />
        </Field>
      )}
      <Field label="Pay date delay (days after period ends)" htmlFor="payDelayDays">
        <Input
          id="payDelayDays"
          name="payDelayDays"
          type="number"
          min="0"
          defaultValue={defaultValues?.payDelayDays ?? 10}
        />
      </Field>
      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? "Saving..." : "Save cut-off schedule"}
      </Button>
    </form>
  );
}
