"use client";

import { useActionState } from "react";
import { Button, ErrorText } from "@/components/ui";
import { sendPayslipReadyAction } from "@/lib/actions/notifications";

export function SendPayslipReadyButton({
  payPeriodId,
  periodLabel,
  count,
}: {
  payPeriodId: string;
  periodLabel: string;
  count: number;
}) {
  const [state, formAction, pending] = useActionState(
    sendPayslipReadyAction,
    undefined
  );

  return (
    <form
      action={formAction}
      className="flex flex-col gap-2 print:hidden"
      onSubmit={(e) => {
        if (
          !window.confirm(
            `Email all ${count} member${
              count === 1 ? "" : "s"
            } that their payslip for ${periodLabel} is ready?`
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="payPeriodId" value={payPeriodId} />
      <div className="flex items-center gap-3">
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Sending…" : "Notify members payslips are ready"}
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
