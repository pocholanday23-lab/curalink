"use client";

import { useActionState } from "react";
import { clockInAction, clockOutAction } from "@/lib/actions/time-entries";
import { formatDateTime } from "@/lib/format";

type AssignmentOption = {
  id: string;
  label: string;
};

const bigButton =
  "w-full rounded-2xl px-8 py-6 text-lg font-bold uppercase tracking-wide text-white shadow-lg transition-colors disabled:cursor-not-allowed disabled:opacity-60";

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
      <form action={outAction} className="flex flex-col items-center gap-4 text-center">
        {outState?.error && (
          <p className="text-sm text-red-600">{outState.error}</p>
        )}
        <div>
          <p className="text-sm text-neutral-500">Clocked in since</p>
          <p className="text-lg font-semibold text-neutral-900">
            {formatDateTime(openEntryClockIn)}
          </p>
        </div>
        <button
          type="submit"
          disabled={outPending}
          className={`${bigButton} bg-[#8a3b2c] hover:bg-[#742f22]`}
        >
          {outPending ? "Clocking out…" : "Time Out"}
        </button>
      </form>
    );
  }

  return (
    <form action={inAction} className="flex flex-col items-center gap-4">
      {inState?.error && (
        <p className="text-sm text-red-600">{inState.error}</p>
      )}
      {assignments.length > 1 && (
        <select
          name="assignmentId"
          required
          defaultValue=""
          className="w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm text-neutral-900"
        >
          <option value="" disabled>
            Select client / project
          </option>
          {assignments.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </select>
      )}
      {assignments.length === 0 && (
        <p className="text-center text-sm text-amber-700">
          You have no active client assignment. Contact your admin.
        </p>
      )}
      <button
        type="submit"
        disabled={inPending || assignments.length === 0}
        className={`${bigButton} bg-[var(--ahora-chrome)] hover:bg-[#163d24]`}
      >
        {inPending ? "Clocking in…" : "Time In / Out"}
      </button>
    </form>
  );
}
