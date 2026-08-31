"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui";

export function PeriodSelect({
  periods,
  selectedId,
}: {
  periods: { id: string; label: string }[];
  selectedId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <Select
      value={selectedId}
      onChange={(e) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("payPeriodId", e.target.value);
        router.push(`${pathname}?${params.toString()}`);
      }}
    >
      {periods.map((p) => (
        <option key={p.id} value={p.id}>
          {p.label}
        </option>
      ))}
    </Select>
  );
}
