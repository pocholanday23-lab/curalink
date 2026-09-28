"use client";

import { useActionState, useRef } from "react";
import { Button, ErrorText, Field, Input, Select } from "@/components/ui";
import {
  uploadContractAction,
  updateContractFieldsAction,
  deleteContractAction,
  type ContractActionState,
} from "@/lib/actions/contracts";

export type EditableContract = {
  id: string;
  fileName: string;
  uploadedLabel: string;
  clientId: string;
  billRatePhp: string;
  contractStart: string;
  contractEnd: string;
};

export function ContractManager({
  employeeId,
  contracts,
  clients,
}: {
  employeeId: string;
  contracts: EditableContract[];
  clients: { id: string; name: string }[];
}) {
  const uploadRef = useRef<HTMLDialogElement>(null);
  const [uploadState, uploadAction, uploadPending] = useActionState<
    ContractActionState,
    FormData
  >(uploadContractAction.bind(null, employeeId), undefined);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-medium">
          {contracts.length} contract{contracts.length === 1 ? "" : "s"}{" "}
          uploaded
        </span>
        <Button
          type="button"
          variant="secondary"
          onClick={() => uploadRef.current?.showModal()}
        >
          Upload contract
        </Button>
      </div>

      {contracts.length > 0 && (
        <ul className="flex flex-col gap-3">
          {contracts.map((c) => (
            <ContractRow key={c.id} contract={c} clients={clients} />
          ))}
        </ul>
      )}

      <dialog
        ref={uploadRef}
        onClick={(e) => {
          if (e.target === uploadRef.current) uploadRef.current?.close();
        }}
        className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-lg border border-black/10 bg-white p-0 text-neutral-900 shadow-xl backdrop:bg-black/60"
      >
        <form action={uploadAction} className="flex flex-col gap-4 p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-lg font-semibold">Upload contract</h2>
            <button
              type="button"
              onClick={() => uploadRef.current?.close()}
              aria-label="Close"
              className="rounded-md border border-black/15 px-3 py-1.5 text-sm hover:bg-black/5"
            >
              Close
            </button>
          </div>
          <ErrorText>{uploadState?.error}</ErrorText>
          {uploadState?.ok && (
            <p className="text-sm text-green-700">{uploadState.ok}</p>
          )}
          <Field label="Contract PDF" htmlFor="file">
            <Input id="file" name="file" type="file" accept="application/pdf" required />
          </Field>
          <p className="text-xs text-neutral-600">
            Client, bill rate, and contract dates are read from the PDF
            automatically where possible — correct them below after
            uploading if needed.
          </p>
          <Button type="submit" disabled={uploadPending} className="self-start">
            {uploadPending ? "Uploading..." : "Upload"}
          </Button>
        </form>
      </dialog>
    </div>
  );
}

function ContractRow({
  contract,
  clients,
}: {
  contract: EditableContract;
  clients: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState<
    ContractActionState,
    FormData
  >(updateContractFieldsAction.bind(null, contract.id), undefined);

  return (
    <li className="rounded-lg border border-black/10 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-sm font-medium">{contract.fileName}</span>
          <span className="text-xs text-neutral-600">
            Uploaded {contract.uploadedLabel}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={`/api/contracts/${contract.id}/file`}
            target="_blank"
            rel="noopener"
            className="text-sm font-medium underline underline-offset-2"
          >
            View PDF
          </a>
          <form action={deleteContractAction.bind(null, contract.id)}>
            <Button type="submit" variant="danger" className="px-3 py-1 text-xs">
              Delete
            </Button>
          </form>
        </div>
      </div>
      <form action={formAction} className="grid gap-3 sm:grid-cols-4">
        {state?.error && (
          <div className="sm:col-span-4">
            <ErrorText>{state.error}</ErrorText>
          </div>
        )}
        {state?.ok && (
          <p className="text-sm text-green-700 sm:col-span-4">{state.ok}</p>
        )}
        <Field label="Client" htmlFor={`client-${contract.id}`}>
          <Select
            id={`client-${contract.id}`}
            name="clientId"
            defaultValue={contract.clientId}
          >
            <option value="">Not matched</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Bill rate (PHP)" htmlFor={`rate-${contract.id}`}>
          <Input
            id={`rate-${contract.id}`}
            name="billRatePhp"
            inputMode="decimal"
            defaultValue={contract.billRatePhp}
          />
        </Field>
        <Field label="Contract start" htmlFor={`start-${contract.id}`}>
          <Input
            id={`start-${contract.id}`}
            name="contractStart"
            type="date"
            defaultValue={contract.contractStart}
          />
        </Field>
        <Field label="Contract end" htmlFor={`end-${contract.id}`}>
          <Input
            id={`end-${contract.id}`}
            name="contractEnd"
            type="date"
            defaultValue={contract.contractEnd}
          />
        </Field>
        <div className="sm:col-span-4">
          <Button type="submit" variant="secondary" disabled={pending}>
            {pending ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </li>
  );
}
