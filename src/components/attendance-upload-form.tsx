"use client";

import { useActionState } from "react";
import { Button, ErrorText, Field, Input } from "@/components/ui";
import { uploadAttendanceAction } from "@/lib/actions/attendance";

export function AttendanceUploadForm() {
  const [state, formAction, pending] = useActionState(
    uploadAttendanceAction,
    undefined
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <ErrorText>{state?.error}</ErrorText>
      <div className="flex flex-wrap items-end gap-4">
        <Field label="Attendance workbook (.xlsx)" htmlFor="file">
          <Input id="file" name="file" type="file" accept=".xlsx,.xls" required />
        </Field>
        <Field label="Fallback year" htmlFor="fallbackYear">
          <div className="w-24">
            <Input
              id="fallbackYear"
              name="fallbackYear"
              type="number"
              defaultValue={new Date().getFullYear()}
            />
          </div>
        </Field>
        <Button type="submit" disabled={pending}>
          {pending ? "Uploading..." : "Upload"}
        </Button>
      </div>
      <p className="text-xs text-black/50 dark:text-white/50">
        Expected columns: Last Name, First Name, then one column per date
        (P = present, A = absent, RD = rest day). Weekends left out of the
        file are filled in automatically as rest days. The fallback year is
        only used if a date column header is plain text without a year (e.g.
        &quot;3-Aug&quot;).
      </p>
    </form>
  );
}
