"use client";

import { useActionState, useState } from "react";
import { Button, ErrorText, Field, Input, Select, Textarea } from "@/components/ui";
import { BANK_TYPE_OPTIONS, MARITAL_STATUS_OPTIONS } from "@/lib/hr";
import type { HrActionState } from "@/lib/actions/hr";

export type ProfileFormValues = {
  firstName: string;
  lastName: string;
  middleName: string;
  email: string;
  salaryUsd: string;
  salaryPhp: string;
  birthDate: string;
  contactNumber: string;
  homeAddress: string;
  maritalStatus: string;
  spouseName: string;
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
  role: string;
  managerId: string;
  active: boolean;
  dependents: { name: string; birthDate: string }[];
};

const EMPTY: ProfileFormValues = {
  firstName: "",
  lastName: "",
  middleName: "",
  email: "",
  salaryUsd: "",
  salaryPhp: "",
  birthDate: "",
  contactNumber: "",
  homeAddress: "",
  maritalStatus: "",
  spouseName: "",
  sssNo: "",
  tinNo: "",
  pagibigNo: "",
  bankName: "",
  bankBranch: "",
  bankAccountName: "",
  bankAccountNumber: "",
  bankType: "",
  emergencyContactName: "",
  emergencyContactNumber: "",
  role: "EMPLOYEE",
  managerId: "",
  active: true,
  dependents: [],
};

/** Progressive (09XX)-XXXXXXX mask for an 11-digit PH mobile number. */
function formatPhMobile(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 4) return digits.length ? `(${digits}` : "";
  return `(${digits.slice(0, 4)})-${digits.slice(4)}`;
}

const PH_MOBILE_PATTERN = "\\(09\\d{2}\\)-\\d{7}";

function Fieldset({
  legend,
  children,
}: {
  legend: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-4 rounded-lg border border-black/10 p-4 dark:border-white/10">
      <legend className="px-1 text-sm font-semibold">{legend}</legend>
      {children}
    </fieldset>
  );
}

export function ProfileForm({
  action,
  mode,
  canEditAccount = false,
  canEditPay = false,
  managers = [],
  defaultValues,
  lockedEmail,
  assignedManagerName,
  submitLabel,
  strict = false,
}: {
  action: (
    state: HrActionState,
    formData: FormData
  ) => Promise<HrActionState>;
  mode: "create" | "edit";
  canEditAccount?: boolean;
  canEditPay?: boolean;
  managers?: { id: string; name: string }[];
  defaultValues?: Partial<ProfileFormValues>;
  /** Onboarding form: email comes from the invite and can't be changed here. */
  lockedEmail?: string;
  /** Onboarding form: show who they'll report to, read-only. */
  assignedManagerName?: string | null;
  submitLabel?: string;
  /**
   * Onboarding form: every field is required except dependents; marital
   * status of Single locks the spouse field to "N/A"; contact number is
   * masked to (09XX)-XXXXXXX.
   */
  strict?: boolean;
}) {
  const initial = { ...EMPTY, ...defaultValues };
  const [state, formAction, pending] = useActionState(action, undefined);
  const [dependents, setDependents] = useState<
    { name: string; birthDate: string }[]
  >(initial.dependents.length > 0 ? initial.dependents : []);
  const [maritalStatus, setMaritalStatus] = useState(initial.maritalStatus);
  const [spouseName, setSpouseName] = useState(initial.spouseName);
  const [contactNumber, setContactNumber] = useState(
    strict ? formatPhMobile(initial.contactNumber) : initial.contactNumber
  );
  const isSingle = maritalStatus === "SINGLE";

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <ErrorText>{state?.error}</ErrorText>

      <Fieldset legend="Name">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="First name" htmlFor="firstName">
            <Input
              id="firstName"
              name="firstName"
              required
              defaultValue={initial.firstName}
            />
          </Field>
          <Field label="Middle name" htmlFor="middleName">
            <Input
              id="middleName"
              name="middleName"
              required={strict}
              defaultValue={initial.middleName}
            />
          </Field>
          <Field label="Last name" htmlFor="lastName">
            <Input
              id="lastName"
              name="lastName"
              required
              defaultValue={initial.lastName}
            />
          </Field>
        </div>
        {lockedEmail ? (
          <Field label="Email" htmlFor="email">
            <Input id="email" name="email" type="email" value={lockedEmail} readOnly />
          </Field>
        ) : (
          <Field label="Email" htmlFor="email">
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={initial.email}
            />
          </Field>
        )}
        {assignedManagerName !== undefined && (
          <p className="text-xs opacity-70">
            {assignedManagerName
              ? `You'll be reporting to ${assignedManagerName}.`
              : "No manager has been assigned yet — HR will set one up for you."}
          </p>
        )}
      </Fieldset>

      {canEditAccount && (
        <Fieldset legend="Account">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Role" htmlFor="role">
              <Select id="role" name="role" defaultValue={initial.role}>
                <option value="EMPLOYEE">Employee</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
              </Select>
            </Field>
            <Field label="Manager" htmlFor="managerId">
              <Select
                id="managerId"
                name="managerId"
                defaultValue={initial.managerId}
              >
                <option value="">No manager</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          {mode === "edit" && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="active"
                defaultChecked={initial.active}
              />
              Active
            </label>
          )}
          {mode === "create" && (
            <p className="text-xs text-black/50 dark:text-white/50">
              A username is generated automatically (first initial + last name).
              The account starts with the default password{" "}
              <code>password123</code> and must be changed on first login.
            </p>
          )}
        </Fieldset>
      )}

      {canEditPay && (
        <Fieldset legend="Compensation">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Salary (USD)" htmlFor="salaryUsd">
              <Input
                id="salaryUsd"
                name="salaryUsd"
                inputMode="decimal"
                defaultValue={initial.salaryUsd}
              />
            </Field>
            <Field label="Salary (PHP)" htmlFor="salaryPhp">
              <Input
                id="salaryPhp"
                name="salaryPhp"
                inputMode="decimal"
                defaultValue={initial.salaryPhp}
              />
            </Field>
          </div>
        </Fieldset>
      )}

      <Fieldset legend="Personal">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Birth date" htmlFor="birthDate">
            <Input
              id="birthDate"
              name="birthDate"
              type="date"
              required={strict}
              defaultValue={initial.birthDate}
            />
          </Field>
          <Field label="Marital status" htmlFor="maritalStatus">
            <Select
              id="maritalStatus"
              name="maritalStatus"
              required={strict}
              value={maritalStatus}
              onChange={(e) => setMaritalStatus(e.target.value)}
            >
              <option value="" disabled={strict}>
                —
              </option>
              {MARITAL_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Name of spouse" htmlFor="spouseName">
            <Input
              id="spouseName"
              name="spouseName"
              required={strict && !isSingle}
              readOnly={isSingle}
              value={isSingle ? "N/A" : spouseName}
              onChange={(e) => setSpouseName(e.target.value)}
              className={
                isSingle
                  ? "cursor-not-allowed bg-black/10 dark:bg-white/10"
                  : undefined
              }
            />
          </Field>
          <Field label="Contact number" htmlFor="contactNumber">
            <Input
              id="contactNumber"
              name="contactNumber"
              required={strict}
              inputMode="numeric"
              placeholder={strict ? "(09XX)-XXXXXXX" : undefined}
              pattern={strict ? PH_MOBILE_PATTERN : undefined}
              title={strict ? "Format: (09XX)-XXXXXXX" : undefined}
              value={strict ? contactNumber : undefined}
              defaultValue={strict ? undefined : initial.contactNumber}
              onChange={
                strict
                  ? (e) => setContactNumber(formatPhMobile(e.target.value))
                  : undefined
              }
            />
          </Field>
        </div>
        <Field label="Home address" htmlFor="homeAddress">
          <Textarea
            id="homeAddress"
            name="homeAddress"
            rows={2}
            required={strict}
            defaultValue={initial.homeAddress}
          />
        </Field>
      </Fieldset>

      <Fieldset legend="Government IDs">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="SSS No." htmlFor="sssNo">
            <Input
              id="sssNo"
              name="sssNo"
              required={strict}
              defaultValue={initial.sssNo}
            />
          </Field>
          <Field label="TIN No." htmlFor="tinNo">
            <Input
              id="tinNo"
              name="tinNo"
              required={strict}
              defaultValue={initial.tinNo}
            />
          </Field>
          <Field label="Pag-IBIG No." htmlFor="pagibigNo">
            <Input
              id="pagibigNo"
              name="pagibigNo"
              required={strict}
              defaultValue={initial.pagibigNo}
            />
          </Field>
        </div>
      </Fieldset>

      <Fieldset legend="Bank details">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Bank name" htmlFor="bankName">
            <Input
              id="bankName"
              name="bankName"
              required={strict}
              defaultValue={initial.bankName}
            />
          </Field>
          <Field label="Bank branch" htmlFor="bankBranch">
            <Input
              id="bankBranch"
              name="bankBranch"
              required={strict}
              defaultValue={initial.bankBranch}
            />
          </Field>
          <Field label="Account name" htmlFor="bankAccountName">
            <Input
              id="bankAccountName"
              name="bankAccountName"
              required={strict}
              defaultValue={initial.bankAccountName}
            />
          </Field>
          <Field label="Account number" htmlFor="bankAccountNumber">
            <Input
              id="bankAccountNumber"
              name="bankAccountNumber"
              required={strict}
              defaultValue={initial.bankAccountNumber}
            />
          </Field>
          <Field label="Account type" htmlFor="bankType">
            <Select
              id="bankType"
              name="bankType"
              required={strict}
              defaultValue={initial.bankType}
            >
              <option value="" disabled={strict}>
                —
              </option>
              {BANK_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Fieldset>

      <Fieldset legend="Emergency contact">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Contact person" htmlFor="emergencyContactName">
            <Input
              id="emergencyContactName"
              name="emergencyContactName"
              required={strict}
              defaultValue={initial.emergencyContactName}
            />
          </Field>
          <Field label="Mobile number" htmlFor="emergencyContactNumber">
            <Input
              id="emergencyContactNumber"
              name="emergencyContactNumber"
              required={strict}
              defaultValue={initial.emergencyContactNumber}
            />
          </Field>
        </div>
      </Fieldset>

      <Fieldset legend="Dependents (optional)">
        {dependents.length === 0 && (
          <p className="text-sm text-black/50 dark:text-white/50">
            No dependents added.
          </p>
        )}
        {dependents.map((d, i) => (
          <div key={i} className="flex flex-wrap items-end gap-3">
            <div className="min-w-[12rem] flex-1">
              <Field label="Full name" htmlFor={`dependentName-${i}`}>
                <Input
                  id={`dependentName-${i}`}
                  name="dependentName"
                  defaultValue={d.name}
                />
              </Field>
            </div>
            <div className="w-56">
              <Field label="Birth date" htmlFor={`dependentBirthDate-${i}`}>
                <Input
                  id={`dependentBirthDate-${i}`}
                  name="dependentBirthDate"
                  defaultValue={d.birthDate}
                  placeholder="e.g. 05/22/2022"
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
      </Fieldset>

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving..." : submitLabel ?? "Save"}
      </Button>
    </form>
  );
}
