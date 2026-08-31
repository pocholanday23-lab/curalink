import { Badge, Card, Table, Td, Th } from "@/components/ui";
import { formatDateTime, formatHours } from "@/lib/format";
import type { TimeLogGroup } from "@/lib/time-log";

export function TimeLogTable({
  groups,
  emptyLabel = "No clock in / out entries for this period.",
}: {
  groups: TimeLogGroup[];
  emptyLabel?: string;
}) {
  if (groups.length === 0) {
    return (
      <Card className="text-sm text-black/50 dark:text-white/50">
        {emptyLabel}
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {groups.map((g) => (
        <Card key={g.employeeId} className="p-0">
          <div className="flex items-center justify-between border-b border-black/10 px-4 py-3 dark:border-white/10">
            <span className="font-medium">{g.employeeName}</span>
            <Badge>{formatHours(g.totalHours)} total</Badge>
          </div>
          <Table>
            <thead>
              <tr>
                <Th>Client / project</Th>
                <Th>Clock in</Th>
                <Th>Clock out</Th>
                <Th>Hours</Th>
              </tr>
            </thead>
            <tbody>
              {g.entries.map((e) => (
                <tr
                  key={e.id}
                  className="border-t border-black/5 dark:border-white/5"
                >
                  <Td>{e.clientLabel}</Td>
                  <Td>{formatDateTime(e.clockIn)}</Td>
                  <Td>{e.clockOut ? formatDateTime(e.clockOut) : "—"}</Td>
                  <Td>{e.hours != null ? formatHours(e.hours) : "—"}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      ))}
    </div>
  );
}
