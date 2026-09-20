export type StatusFilter = "all" | "active" | "inactive";

export function parseStatusFilter(value: string | undefined): StatusFilter {
  return value === "active" || value === "inactive" ? value : "all";
}
