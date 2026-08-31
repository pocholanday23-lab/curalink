"use client";

import { useActionState, useState } from "react";
import { Button, ErrorText, Field } from "@/components/ui";
import { BANK_TYPE_OPTIONS, MARITAL_STATUS_OPTIONS } from "@/lib/hr";
import type { HrActionState } from "@/lib/actions/hr";

const box =
  "w-full rounded-md border border-white/20 bg-[#374151] px-3 py-2 text-sm text-white placeholder-white/40 outline-none focus:border-white/50 disabled:cursor-not-allowed disabled:opacity-60";

export type SelfProfileValues = {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  username: string;
  role: string;
  managerName: string;
  monthlySalary: string;
  birthDate: string;
  maritalStatus: string;
  spouseName: string;
  contactNumber: string;
  homeAddress: string;
  sssNo: string;
  tinNo: string;
  pagibigNo: string;
  bankName: string;
  bankBranch: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankType: string;
  emergencyContactName: string;
  emergencyContactNumber: string;
  dependents: { name: string; birthDate: string }[];
};

/** Read-only display field — no `name`, so it is never submitted. */
function Locked({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <Field label={label} htmlFor={label}>
      <input id={label} className={box} defaultValue={value} disabled />
    </Field>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-4 rounded-lg border border-black/10 p-4">
      <legend className="px-1 text-sm font-semibold">{title}</legend>
      {children}
    </fieldset>
  );
}

export function SelfProfileForm({
  action,
  defaultValues: v,
}: {
  action: (
    state: HrActionState,
    formData: FormData
  ) => Promise<HrActionState>;
  defaultValues: SelfProfileValues;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [dependents, setDependents] = useState(v.dependents);

  const maritalLabel =
    MARITAL_STATUS_OPTIONS.find((o) => o.value === v.maritalStatus)?.label ??
    v.maritalStatus;
  const bankTypeLabel =
    BANK_TYPE_OPTIONS.find((o) => o.value === v.bankType)?.label ?? v.bankType;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <ErrorText>{state?.error}</ErrorText>

      <p className="text-sm opacity-70">
        You can edit your email, contact number, emergency contact, and
        dependents. Everything else is managed by your manager or an admin — ask
        them to change it.
      </p>

      <Section title="Account">
        <div className="grid gap-4 sm:grid-cols-3">
          <Locked label="Username" value={v.username} />
          <Locked label="Role" value={v.role} />
          <Locked label="Manager" value={v.managerName} />
        </div>
        <Field label="Email address" htmlFor="email">
          <input
            id="email"
            name="email"
            type="email"
            className={box}
            defaultValue={v.email}
          />
        </Field>
      </Section>

      <Section title="Name">
        <div className="grid gap-4 sm:grid-cols-3">
          <Locked label="First name" value={v.firstName} />
          <Locked label="Middle name" value={v.middleName} />
          <Locked label="Last name" value={v.lastName} />
        </div>
      </Section>

      <Section title="Compensation">
        <Locked label="Monthly salary" value={v.monthlySalary} />
      </Section>

      <Section title="Personal">
        <div className="grid gap-4 sm:grid-cols-2">
          <Locked label="Birth date" value={v.birthDate} />
          <Locked label="Marital status" value={maritalLabel} />
          <Locked label="Name of spouse" value={v.spouseName} />
          <Field label="Contact number" htmlFor="contactNumber">
            <input
              id="contactNumber"
              name="contactNumber"
              className={box}
              defaultValue={v.contactNumber}
            />
          </Field>
        </div>
        <Locked label="Home address" value={v.homeAddress} />
      </Section>

      <Section title="Government IDs">
        <div className="grid gap-4 sm:grid-cols-3">
          <Locked label="SSS No." value={v.sssNo} />
          <Locked label="TIN No." value={v.tinNo} />
          <Locked label="Pag-IBIG No." value={v.pagibigNo} />
        </div>
      </Section>

      <Section title="Bank details">
        <div className="grid gap-4 sm:grid-cols-2">
          <Locked label="Bank name" value={v.bankName} />
          <Locked label="Bank branch" value={v.bankBranch} />
          <Locked label="Account name" value={v.bankAccountName} />
          <Locked label="Account number" value={v.bankAccountNumber} />
          <Locked label="Account type" value={bankTypeLabel} />
        </div>
      </Section>

      <Section title="Emergency contact">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Contact person" htmlFor="emergencyContactName">
            <input
              id="emergencyContactName"
              name="emergencyContactName"
              className={box}
              defaultValue={v.emergencyContactName}
            />
          </Field>
          <Field label="Mobile number" htmlFor="emergencyContactNumber">
            <input
              id="emergencyContactNumber"
              name="emergencyContactNumber"
              className={box}
              defaultValue={v.emergencyContactNumber}
            />
          </Field>
        </div>
      </Section>

      <Section title="Dependents">
        {dependents.length === 0 && (
          <p className="text-sm opacity-60">No dependents added.</p>
        )}
        {dependents.map((d, i) => (
          <div key={i} className="flex flex-wrap items-end gap-3">
            <div className="min-w-[12rem] flex-1">
              <Field label="Full name" htmlFor={`dependentName-${i}`}>
                <input
                  id={`dependentName-${i}`}
                  name="dependentName"
                  className={box}
                  defaultValue={d.name}
                />
              </Field>
            </div>
            <div className="w-56">
              <Field label="Birth date" htmlFor={`dependentBirthDate-${i}`}>
                <input
                  id={`dependentBirthDate-${i}`}
                  name="dependentBirthDate"
                  className={box}
                  placeholder="e.g. 05/22/2022"
                  defaultValue={d.birthDate}
                />
              </Field>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                setDependents((rows) => rows.filter((_, idx) => idx !== i))
              }
            >
              Remove
            </Button>
          </div>
        ))}
        <div>
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              setDependents((rows) => [...rows, { name: "", birthDate: "" }])
            }
          >
            Add dependent
          </Button>
        </div>
      </Section>

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
