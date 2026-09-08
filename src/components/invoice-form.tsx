"use client";

import { useActionState, useState } from "react";
import {
  Button,
  ErrorText,
  Field,
  Input,
  Select,
  Textarea,
} from "@/components/ui";
import { formatCurrency } from "@/lib/format";
import type { InvoiceActionState } from "@/lib/actions/invoices";
import type { ClientInvoiceLine } from "@/lib/types";

export type InvoiceFormValues = {
  number: string;
  clientId: string;
  invoiceDate: string;
  currency: string;
  billToName: string;
  billToAddress: string;
  coverageNote: string;
  notes: string;
  billedFrom: string;
  billedTo: string;
  previousInvoiceId: string;
  billedLabel: string;
  lines: ClientInvoiceLine[];
};

export function InvoiceForm({
  action,
  mode,
  clients,
  defaultValues,
}: {
  action: (
    state: InvoiceActionState,
    formData: FormData
  ) => Promise<InvoiceActionState>;
  mode: "create" | "edit";
  clients: { id: string; name: string }[];
  defaultValues: InvoiceFormValues;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [lines, setLines] = useState<ClientInvoiceLine[]>(
    defaultValues.lines.length > 0
      ? defaultValues.lines
      : [{ description: "", coverage: "", amount: 0 }]
  );

  const total = lines.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);

  function update(i: number, patch: Partial<ClientInvoiceLine>) {
    setLines((rows) =>
      rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r))
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <ErrorText>{state?.error}</ErrorText>

      <input type="hidden" name="billedFrom" value={defaultValues.billedFrom} />
      <input type="hidden" name="billedTo" value={defaultValues.billedTo} />
      <input
        type="hidden"
        name="previousInvoiceId"
        value={defaultValues.previousInvoiceId}
      />

      {defaultValues.billedLabel && (
        <p className="text-sm opacity-70">
          Cost of Salary cycle: <strong>{defaultValues.billedLabel}</strong>
          {defaultValues.previousInvoiceId
            ? " · advance-paid line carried from the selected previous invoice"
            : ""}
          . Change it in the &ldquo;Load suggested lines&rdquo; box above.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Invoice number" htmlFor="number">
          <Input id="number" name="number" required defaultValue={defaultValues.number} />
        </Field>
        <Field label="Invoice date" htmlFor="invoiceDate">
          <Input
            id="invoiceDate"
            name="invoiceDate"
            type="date"
            required
            defaultValue={defaultValues.invoiceDate}
          />
        </Field>
        <Field label="Client" htmlFor="clientId">
          <Select
            id="clientId"
            name="clientId"
            required
            defaultValue={defaultValues.clientId}
          >
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
        <Field label="Currency" htmlFor="currency">
          <Select
            id="currency"
            name="currency"
            defaultValue={defaultValues.currency || "USD"}
          >
            <option value="USD">USD</option>
            <option value="PHP">PHP</option>
          </Select>
        </Field>
        <Field label="Bill to (name)" htmlFor="billToName">
          <Input
            id="billToName"
            name="billToName"
            defaultValue={defaultValues.billToName}
          />
        </Field>
        <Field label="Coverage note (optional)" htmlFor="coverageNote">
          <Input
            id="coverageNote"
            name="coverageNote"
            defaultValue={defaultValues.coverageNote}
          />
        </Field>
      </div>

      <Field label="Bill to (address)" htmlFor="billToAddress">
        <Textarea
          id="billToAddress"
          name="billToAddress"
          rows={2}
          defaultValue={defaultValues.billToAddress}
        />
      </Field>

      <fieldset className="flex flex-col gap-3 rounded-lg border border-black/10 p-4 dark:border-white/10">
        <legend className="px-1 text-sm font-semibold">Line items</legend>
        {lines.map((line, i) => (
          <div key={i} className="flex flex-wrap items-end gap-3">
            <div className="min-w-[12rem] flex-1">
              <Field label="Item" htmlFor={`d-${i}`}>
                <Input
                  id={`d-${i}`}
                  name="lineDescription"
                  value={line.description}
                  onChange={(e) => update(i, { description: e.target.value })}
                />
              </Field>
            </div>
            <div className="w-44">
              <Field label="Coverage" htmlFor={`c-${i}`}>
                <Input
                  id={`c-${i}`}
                  name="lineCoverage"
                  value={line.coverage}
                  onChange={(e) => update(i, { coverage: e.target.value })}
                />
              </Field>
            </div>
            <div className="w-32">
              <Field label="Amount" htmlFor={`a-${i}`}>
                <Input
                  id={`a-${i}`}
                  name="lineAmount"
                  inputMode="decimal"
                  value={String(line.amount)}
                  onChange={(e) =>
                    update(i, {
                      amount: Number(e.target.value.replace(/[^0-9.\-]/g, "")) || 0,
                    })
                  }
                />
              </Field>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                setLines((rows) => rows.filter((_, idx) => idx !== i))
              }
            >
              Remove
            </Button>
          </div>
        ))}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              setLines((rows) => [
                ...rows,
                { description: "", coverage: "", amount: 0 },
              ])
            }
          >
            Add line
          </Button>
          <span className="text-sm font-medium">
            Total: {formatCurrency(total)}
          </span>
        </div>
      </fieldset>

      <Field label="Notes (internal, optional)" htmlFor="notes">
        <Textarea
          id="notes"
          name="notes"
          rows={2}
          defaultValue={defaultValues.notes}
        />
      </Field>

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving..." : mode === "create" ? "Create invoice" : "Save"}
      </Button>
    </form>
  );
}
