"use client";

import { Button } from "@/components/ui";

export function ImpersonateButton({
  employeeId,
  disabled,
}: {
  employeeId: string;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="secondary"
      disabled={disabled}
      onClick={() =>
        window.open(`/admin/impersonate/${employeeId}`, "_blank", "noopener")
      }
      className="px-3 py-1 text-xs"
    >
      Log in as
    </Button>
  );
}
