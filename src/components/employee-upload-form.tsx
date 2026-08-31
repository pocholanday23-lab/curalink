"use client";

import { useActionState } from "react";
import { Button, ErrorText, Field, Input, Select } from "@/components/ui";
import { uploadEmployeesAction } from "@/lib/actions/hr";

export function EmployeeUploadForm({
  managers,
}: {
  managers?: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(
    uploadEmployeesAction,
    undefined
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <ErrorText>{state?.error}</ErrorText>
      <div className="flex flex-wrap items-end gap-4">
        <Field label="Employee workbook (.xlsx)" htmlFor="file">
          <Input id="file" name="file" type="file" accept=".xlsx,.xls" required />
        </Field>
        {managers && managers.length > 0 && (
          <Field label="Assign new hires to" htmlFor="managerId">
            <Select id="managerId" name="managerId" defaultValue="">
              <option value="">No manager</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? "Uploading..." : "Upload"}
        </Button>
      </div>
      <p className="text-xs text-black/50 dark:text-white/50">
        The importer reads every sheet and matches people by First Name + Last
        Name. Recognised columns include: Last/First/Middle Name, Salary USD,
        Salary PHP, Birth date, Contact Number, Home Address, Marital Status,
        Name of Spouse, Child fullname and Birthdate (1–4), SSS No., TIN No.,
        Pag-IBIG No., Bank Name, Bank Branch, Bank Account Name, Bank Account
        Number, Bank Type, Emergency Contact Person, Emergency Contact Person
        Mobile Number, Email. New people are created with the default password;
        existing people (matched by email or name) are updated in place.
      </p>
    </form>
  );
}
