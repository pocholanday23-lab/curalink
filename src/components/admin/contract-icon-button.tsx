"use client";

import { useRef, useState } from "react";
import { ContractIcon } from "@/components/ahora/icons";

export type ContractListItem = {
  id: string;
  fileName: string;
  uploadedLabel: string;
  rangeLabel: string | null;
};

/**
 * Contract icon on the Employees list. Grayed out (no dialog) when the
 * employee has no contracts. With exactly one, clicking opens the PDF
 * viewer directly; with two or more, it opens a list first.
 */
export function ContractIconButton({
  contracts,
}: {
  contracts: ContractListItem[];
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (contracts.length === 0) {
    return (
      <span
        title="No contract uploaded"
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-neutral-300 [&_svg]:h-[18px] [&_svg]:w-[18px]"
      >
        <ContractIcon />
      </span>
    );
  }

  const single = contracts.length === 1 ? contracts[0] : null;
  const activeId = selectedId ?? single?.id ?? null;
  const active = contracts.find((c) => c.id === activeId) ?? null;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setSelectedId(single ? single.id : null);
          ref.current?.showModal();
        }}
        title="View contract"
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--ahora-chrome)] hover:bg-black/5 [&_svg]:h-[18px] [&_svg]:w-[18px]"
      >
        <ContractIcon />
      </button>
      <dialog
        ref={ref}
        onClick={(e) => {
          if (e.target === ref.current) ref.current?.close();
        }}
        onClose={() => setSelectedId(single ? single.id : null)}
        className="m-auto w-[min(56rem,calc(100vw-2rem))] max-h-[90vh] rounded-lg border border-black/10 bg-white p-0 text-neutral-900 shadow-xl backdrop:bg-black/60"
      >
        <div className="flex h-[80vh] flex-col gap-3 p-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="truncate text-base font-semibold">
              {active ? active.fileName : "Contracts"}
            </h2>
            <div className="flex shrink-0 gap-2">
              {active && contracts.length > 1 && (
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="rounded-md border border-black/15 px-3 py-1.5 text-sm hover:bg-black/5"
                >
                  Back to list
                </button>
              )}
              <button
                type="button"
                onClick={() => ref.current?.close()}
                aria-label="Close"
                className="rounded-md border border-black/15 px-3 py-1.5 text-sm hover:bg-black/5"
              >
                Close
              </button>
            </div>
          </div>

          {!active ? (
            <ul className="flex flex-col divide-y divide-black/10 overflow-y-auto">
              {contracts.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    className="flex w-full flex-col gap-0.5 px-2 py-3 text-left hover:bg-black/5"
                  >
                    <span className="text-sm font-medium">{c.fileName}</span>
                    <span className="text-xs text-neutral-600">
                      Uploaded {c.uploadedLabel}
                      {c.rangeLabel ? ` · ${c.rangeLabel}` : ""}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <iframe
              src={`/api/contracts/${active.id}/file`}
              className="min-h-0 flex-1 rounded-md border border-black/10"
              title={active.fileName}
            />
          )}
        </div>
      </dialog>
    </>
  );
}
