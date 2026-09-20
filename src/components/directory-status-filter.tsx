import { Button, Field, Select } from "@/components/ui";

export type StatusFilter = "all" | "active" | "inactive";

export function parseStatusFilter(value: string | undefined): StatusFilter {
  return value === "active" || value === "inactive" ? value : "all";
}

export function DirectoryStatusFilter({ value }: { value: StatusFilter }) {
  return (
    <form
      method="get"
      className="flex flex-wrap items-end gap-3 border-b border-black/10 px-4 py-3 dark:border-white/10"
    >
      <Field label="Status" htmlFor="status">
        <Select id="status" name="status" defaultValue={value}>
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </Field>
      <Button type="submit" variant="secondary">
        Filter
      </Button>
    </form>
  );
}
