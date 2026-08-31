"use client";

import { useActionState } from "react";
import { clockInAction, clockOutAction } from "@/lib/actions/time-entries";
import { Button, ErrorText, Select } from "@/components/ui";
import { formatDateTime } from "@/lib/format";

type AssignmentOption = {
  id: string;
  label: string;
};

export function ClockWidget({
  openEntryClockIn,
  assignments,
}: {
  openEntryClockIn: string | null;
  assignments: AssignmentOption[];
}) {
  const [inState, inAction, inPending] = useActionState(
    clockInAction,
    undefined
  );
  const [outState, outAction, outPending] = useActionState(
    clockOutAction,
    undefined
  );

  if (openEntryClockIn) {
    return (
      <form action={outAction} className="flex flex-col gap-4">
        <ErrorText>{outState?.error}</ErrorText>
        <div>
          <p className="text-sm text-black/60 dark:text-white/60">
            Clocked in since
          </p>
          <p className="text-lg font-semibold">
            {formatDateTime(openEntryClockIn)}
          </p>
        </div>
        <Button
          type="submit"
          variant="danger"
          disabled={outPending}
          className="w-full"
        >
          {outPending ? "Clocking out..." : "Clock out"}
        </Button>
      </form>
    );
  }

  return (
    <form action={inAction} className="flex flex-col gap-4">
      <ErrorText>{inState?.error}</ErrorText>
      {assignments.length > 1 && (
        <Select name="assignmentId" required defaultValue="">
          <option value="" disabled>
            Select client / project
          </option>
          {assignments.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </Select>
      )}
      {assignments.length === 0 && (
        <p className="text-sm text-amber-700 dark:text-amber-400">
          You have no active client assignment. Contact your admin.
        </p>
      )}
      <Button
        type="submit"
        disabled={inPending || assignments.length === 0}
        className="w-full"
      >
        {inPending ? "Clocking in..." : "Clock in"}
      </Button>
    </form>
  );
}
