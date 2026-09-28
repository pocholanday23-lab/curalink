"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { stopImpersonationAction } from "@/lib/actions/impersonation";

export function ImpersonationBanner({
  name,
  impersonatorName,
}: {
  name: string;
  impersonatorName: string | null | undefined;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleExit() {
    startTransition(async () => {
      await stopImpersonationAction();
      // "Log in as" always opens this tab via window.open, so it can close
      // itself, dropping the admin back onto whichever tab they were on.
      window.close();
      // If the browser refused to close it (e.g. this tab wasn't
      // script-opened — a bookmarked or shared link), fall back to
      // navigating back to the admin view instead of leaving it stuck.
      router.push("/admin/employees");
    });
  }

  return (
    <div className="bg-amber-500 text-black print:hidden">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-6 py-2 text-sm">
        <span>
          Viewing as <span className="font-semibold">{name}</span>
          {impersonatorName ? ` — signed in by ${impersonatorName}` : ""}.
        </span>
        <button
          type="button"
          disabled={pending}
          onClick={handleExit}
          className="rounded-md bg-black/80 px-3 py-1 font-medium text-white hover:bg-black disabled:opacity-60"
        >
          {pending ? "Exiting…" : "Exit"}
        </button>
      </div>
    </div>
  );
}
