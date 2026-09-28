"use client";

import { useRef } from "react";

/**
 * One of the 6 tiles on the Admin hub. Clicking it opens its content in a
 * `<dialog>` "small window" (same pattern as BulkUploadDialog). The content
 * itself is server-rendered and passed in as `children` — a rendered React
 * element can cross the server/client boundary, so the admin page keeps
 * doing its data fetching as a Server Component.
 */
export function SettingsBox({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-[var(--ahora-mint)] p-4 text-center shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md sm:p-6"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--ahora-chrome)] text-white [&_svg]:h-6 [&_svg]:w-6 sm:h-12 sm:w-12">
          {icon}
        </span>
        <span className="text-sm font-semibold text-neutral-900">{title}</span>
        {subtitle && (
          <span className="text-xs text-neutral-600">{subtitle}</span>
        )}
      </button>
      <dialog
        ref={ref}
        onClick={(e) => {
          if (e.target === ref.current) ref.current?.close();
        }}
        className="m-auto w-[min(64rem,calc(100vw-2rem))] max-h-[85vh] overflow-y-auto rounded-lg border border-black/10 bg-white p-0 text-neutral-900 shadow-xl backdrop:bg-black/60"
      >
        <div className="flex flex-col gap-4 p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button
              type="button"
              onClick={() => ref.current?.close()}
              aria-label="Close"
              className="rounded-md border border-black/15 bg-white px-3 py-1.5 text-sm hover:bg-black/5"
            >
              Close
            </button>
          </div>
          {children}
        </div>
      </dialog>
    </>
  );
}
