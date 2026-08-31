"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  Badge,
  Button,
  ErrorText,
  Field,
  Input,
  Select,
  Table,
  Td,
  Th,
} from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/format";
import type { AssignmentActionState } from "@/lib/actions/assignments";

type EmployeeOption = { id: string; name: string };

type AssignmentRow = {
  id: string;
  employeeName: string;
  projectName: string | null;
  payRate: string;
  billRate: string;
  startDate: string;
  active: boolean;
};

export function ClientAssignments({
  action,
  employees,
  assignments,
}: {
  action: (
    state: AssignmentActionState,
    formData: FormData
  ) => Promise<AssignmentActionState>;
  employees: EmployeeOption[];
  assignments: AssignmentRow[];
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-4">
      {assignments.length > 0 ? (
        <Table>
          <thead>
            <tr>
              <Th>Employee</Th>
              <Th>Project</Th>
              <Th>Pay rate</Th>
              <Th>Bill rate</Th>
              <Th>Start</Th>
              <Th>Status</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {assignments.map((a) => (
              <tr
                key={a.id}
                className="border-t border-black/5 dark:border-white/5"
              >
                <Td>{a.employeeName}</Td>
                <Td>{a.projectName ?? "—"}</Td>
                <Td>{formatCurrency(a.payRate)}/h</Td>
                <Td>{formatCurrency(a.billRate)}/h</Td>
                <Td>{formatDate(a.startDate)}</Td>
                <Td>
                  <Badge tone={a.active ? "green" : "neutral"}>
                    {a.active ? "Active" : "Inactive"}
                  </Badge>
                </Td>
                <Td>
                  <Link
                    href={`/admin/assignments/${a.id}/edit`}
                    className="font-medium underline underline-offset-2"
                  >
                    Edit
                  </Link>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <p className="text-sm text-black/50 dark:text-white/50">
          No employees assigned to this client yet.
        </p>
      )}

      <form
        action={formAction}
        className="flex flex-col gap-4 rounded-lg border border-black/10 p-4 dark:border-white/10"
      >
        <span className="text-sm font-medium">Assign an employee</span>
        <ErrorText>{state?.error}</ErrorText>

        <div className="grid gap-4 sm:grid-cols-2">
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
          <Field label="Project name (optional)" htmlFor="projectName">
            <Input id="projectName" name="projectName" />
          </Field>
          <Field label="Pay rate ($/hr)" htmlFor="payRate">
            <Input
              id="payRate"
              name="payRate"
              type="number"
              step="0.01"
              min="0"
              defaultValue="0"
            />
          </Field>
          <Field label="Bill rate ($/hr)" htmlFor="billRate">
            <Input
              id="billRate"
              name="billRate"
              type="number"
              step="0.01"
              min="0"
              defaultValue="0"
            />
          </Field>
          <Field label="Start date" htmlFor="startDate">
            <Input
              id="startDate"
              name="startDate"
              type="date"
              required
              defaultValue={today}
            />
          </Field>
        </div>

        <Button type="submit" disabled={pending} className="self-start">
          {pending ? "Assigning..." : "Assign employee"}
        </Button>
      </form>
    </div>
  );
}
