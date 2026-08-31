"use client";

import { useActionState } from "react";
import { Button, ErrorText, Field, Input, Textarea } from "@/components/ui";
import { saveCompanySettingsAction } from "@/lib/actions/company";
import type { CompanySettings } from "@/lib/company";

export function CompanySettingsForm({
  defaultValues,
}: {
  defaultValues: CompanySettings;
}) {
  const [state, formAction, pending] = useActionState(
    saveCompanySettingsAction,
    undefined
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <ErrorText>{state?.error}</ErrorText>
      {state?.saved && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-300">
          Saved.
        </p>
      )}

      <Field label="Company name" htmlFor="name">
        <Input id="name" name="name" required defaultValue={defaultValues.name} />
      </Field>
      <Field label="Company Reg. ID" htmlFor="registrationId">
        <Input
          id="registrationId"
          name="registrationId"
          defaultValue={defaultValues.registrationId ?? ""}
        />
      </Field>
      <Field label="Invoice header address" htmlFor="invoiceAddress">
        <Textarea
          id="invoiceAddress"
          name="invoiceAddress"
          rows={2}
          defaultValue={defaultValues.invoiceAddress ?? ""}
        />
      </Field>
      <Field label="Payslip header address" htmlFor="payslipAddress">
        <Textarea
          id="payslipAddress"
          name="payslipAddress"
          rows={2}
          defaultValue={defaultValues.payslipAddress ?? ""}
        />
      </Field>
      <Field label="Logo URL (optional)" htmlFor="logoUrl">
        <Input
          id="logoUrl"
          name="logoUrl"
          defaultValue={defaultValues.logoUrl ?? ""}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Bank name" htmlFor="bankName">
          <Input
            id="bankName"
            name="bankName"
            defaultValue={defaultValues.bankName ?? ""}
          />
        </Field>
        <Field label="Bank account name" htmlFor="bankAccountName">
          <Input
            id="bankAccountName"
            name="bankAccountName"
            defaultValue={defaultValues.bankAccountName ?? ""}
          />
        </Field>
        <Field label="Bank account number" htmlFor="bankAccountNumber">
          <Input
            id="bankAccountNumber"
            name="bankAccountNumber"
            defaultValue={defaultValues.bankAccountNumber ?? ""}
          />
        </Field>
        <Field label="Bank branch" htmlFor="bankBranch">
          <Input
            id="bankBranch"
            name="bankBranch"
            defaultValue={defaultValues.bankBranch ?? ""}
          />
        </Field>
        <Field label="Bank address" htmlFor="bankAddress">
          <Input
            id="bankAddress"
            name="bankAddress"
            defaultValue={defaultValues.bankAddress ?? ""}
          />
        </Field>
        <Field label="SWIFT code" htmlFor="swiftCode">
          <Input
            id="swiftCode"
            name="swiftCode"
            defaultValue={defaultValues.swiftCode ?? ""}
          />
        </Field>
        <Field label="Service charge %" htmlFor="serviceChargePct">
          <Input
            id="serviceChargePct"
            name="serviceChargePct"
            inputMode="decimal"
            defaultValue={String(defaultValues.serviceChargePct)}
          />
        </Field>
      </div>

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving..." : "Save settings"}
      </Button>
    </form>
  );
}
