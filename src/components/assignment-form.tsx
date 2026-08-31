"use client";

import { useActionState } from "react";
import { Button, ErrorText, Field, Input, Select } from "@/components/ui";
import type { AssignmentActionState } from "@/lib/actions/assignments";

type Option = { id: string; name: string };

function toDateInputValue(date: Date | null | undefined) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

export function AssignmentForm({
  action,
  mode,
  employees,
  clients,
  defaultValues,
}: {
  action: (
    state: AssignmentActionState,
    formData: FormData
  ) => Promise<AssignmentActionState>;
  mode: "create" | "edit";
  employees: Option[];
  clients: Option[];
  defaultValues?: {
    employeeName?: string;
    clientName?: string;
    projectName: string | null;
    payRate: string;
    billRate: string;
    startDate: Date;
    endDate: Date | null;
    active: boolean;
  };
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <ErrorText>{state?.error}</ErrorText>

      {mode === "create" ? (
        <>
          <Field label="Employee" htmlFor="employeeId">
            <Select id="employeeId" name="employeeId" required defaultValue="">
              <option value="" disabled>
                Select employee
              </option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </Select>
          </Field>
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
        </>
      ) : (
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-black/50 dark:text-white/50">Employee</p>
            <p className="font-medium">{defaultValues?.employeeName}</p>
          </div>
          <div>
            <p className="text-black/50 dark:text-white/50">Client</p>
            <p className="font-medium">{defaultValues?.clientName}</p>
          </div>
        </div>
      )}

      <Field label="Project name (optional)" htmlFor="projectName">
        <Input
          id="projectName"
          name="projectName"
          defaultValue={defaultValues?.projectName ?? ""}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Pay rate ($/hr)" htmlFor="payRate">
          <Input
            id="payRate"
            name="payRate"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={defaultValues?.payRate}
          />
        </Field>
        <Field label="Bill rate ($/hr)" htmlFor="billRate">
          <Input
            id="billRate"
            name="billRate"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={defaultValues?.billRate}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Start date" htmlFor="startDate">
          <Input
            id="startDate"
            name="startDate"
            type="date"
            required
            defaultValue={toDateInputValue(defaultValues?.startDate)}
          />
        </Field>
        {mode === "edit" && (
          <Field label="End date (optional)" htmlFor="endDate">
            <Input
              id="endDate"
              name="endDate"
              type="date"
              defaultValue={toDateInputValue(defaultValues?.endDate)}
            />
          </Field>
        )}
      </div>

      {mode === "edit" && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="active"
            defaultChecked={defaultValues?.active}
          />
          Active
        </label>
      )}

      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
