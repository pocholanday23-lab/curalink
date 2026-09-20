"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Field, Select } from "@/components/ui";
import type { StatusFilter } from "@/lib/status-filter";

/** Applies the status filter as soon as the dropdown changes — no button. */
export function DirectoryStatusFilter({ value }: { value: StatusFilter }) {
  const router = useRouter();
  const pathname = usePathname();
  const [selected, setSelected] = useState<StatusFilter>(value);

  return (
    <div className="flex flex-wrap items-end gap-3 border-b border-black/10 px-4 py-3 dark:border-white/10">
      <Field label="Status" htmlFor="status">
        <Select
          id="status"
          name="status"
          value={selected}
          onChange={(e) => {
            const next = e.target.value as StatusFilter;
            setSelected(next);
            router.replace(next === "all" ? pathname : `${pathname}?status=${next}`);
          }}
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </Field>
    </div>
  );
}
