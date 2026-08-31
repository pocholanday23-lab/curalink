"use client";

import { useActionState } from "react";
import { Button, ErrorText, Field, Input } from "@/components/ui";
import type { ClientActionState } from "@/lib/actions/clients";

export function ClientForm({
  action,
  defaultValues,
  mode,
}: {
  action: (
    state: ClientActionState,
    formData: FormData
  ) => Promise<ClientActionState>;
  defaultValues?: {
    name: string;
    contactName: string | null;
    contactEmail: string | null;
    active: boolean;
  };
  mode: "create" | "edit";
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <ErrorText>{state?.error}</ErrorText>
      <Field label="Client name" htmlFor="name">
        <Input
          id="name"
          name="name"
          required
          defaultValue={defaultValues?.name}
        />
      </Field>
      <Field label="Contact name" htmlFor="contactName">
        <Input
          id="contactName"
          name="contactName"
          defaultValue={defaultValues?.contactName ?? ""}
        />
      </Field>
      <Field label="Contact email" htmlFor="contactEmail">
        <Input
          id="contactEmail"
          name="contactEmail"
          type="email"
          defaultValue={defaultValues?.contactEmail ?? ""}
        />
      </Field>
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
