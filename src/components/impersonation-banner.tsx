import { stopImpersonationAction } from "@/lib/actions/impersonation";

export function ImpersonationBanner({
  name,
  impersonatorName,
}: {
  name: string;
  impersonatorName: string | null | undefined;
}) {
  return (
    <div className="print:hidden bg-amber-500 text-black">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-6 py-2 text-sm">
        <span>
          Viewing as <span className="font-semibold">{name}</span>
          {impersonatorName ? ` — signed in by ${impersonatorName}` : ""}.
        </span>
        <form action={stopImpersonationAction}>
          <button
            type="submit"
            className="rounded-md bg-black/80 px-3 py-1 font-medium text-white hover:bg-black"
          >
            Exit
          </button>
        </form>
      </div>
    </div>
  );
}
