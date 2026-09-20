"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui";
import { EmployeeUploadForm } from "@/components/employee-upload-form";

/**
 * "Bulk upload" button that opens the Excel import form in a modal window.
 * A successful upload redirects back with ?created=…, which closes the dialog
 * so the result badges on the page are visible.
 */
export function BulkUploadDialog({
  managers,
}: {
  managers?: { id: string; name: string }[];
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const searchParams = useSearchParams();
  const resultKey = searchParams.toString();

  useEffect(() => {
    ref.current?.close();
  }, [resultKey]);

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => ref.current?.showModal()}>
        Bulk upload
      </Button>
      <dialog
        ref={ref}
        onClick={(e) => {
          // Clicking the dimmed backdrop (the dialog element itself) closes it.
          if (e.target === ref.current) ref.current?.close();
        }}
        className="m-auto w-[min(42rem,calc(100vw-2rem))] rounded-lg border border-black/10 bg-[var(--green-khaki)] p-0 text-neutral-900 shadow-xl backdrop:bg-black/60"
      >
        <div className="flex flex-col gap-4 p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-lg font-semibold">Bulk upload from Excel</h2>
            <Button
              type="button"
              variant="secondary"
              onClick={() => ref.current?.close()}
              aria-label="Close"
            >
              Close
            </Button>
          </div>
          <EmployeeUploadForm managers={managers} />
        </div>
      </dialog>
    </>
  );
}
