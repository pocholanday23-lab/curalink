"use client";

import { useState, useTransition } from "react";
import { Table, Th, Td } from "@/components/ui";
import { setAttendanceStatusAction } from "@/lib/actions/attendance";
import { ATTENDANCE_STATUS_LABELS, computeAttendanceSummary } from "@/lib/attendance";
import type { AttendanceStatus } from "@/generated/prisma/client";

type StatusMap = Record<string, Record<string, AttendanceStatus | undefined>>;

function formatColumnHeader(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function isWeekendISO(iso: string) {
  const day = new Date(`${iso}T00:00:00Z`).getUTCDay();
  return day === 0 || day === 6;
}

export function AttendanceTable({
  employees,
  dates,
  initialStatuses,
  derivedCells,
}: {
  employees: { id: string; name: string }[];
  dates: string[];
  initialStatuses: StatusMap;
  /** Cells whose status was auto-detected from clock in/out, not entered by a person. */
  derivedCells?: Record<string, Record<string, boolean>>;
}) {
  const [statuses, setStatuses] = useState<StatusMap>(initialStatuses);
  const [derived, setDerived] = useState(derivedCells ?? {});
  const [pendingCells, setPendingCells] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  function handleChange(employeeId: string, dateISO: string, value: string) {
    const nextStatus = (value || null) as AttendanceStatus | null;
    const cellKey = `${employeeId}:${dateISO}`;
    const previous = statuses[employeeId]?.[dateISO];

    setStatuses((prev) => ({
      ...prev,
      [employeeId]: { ...prev[employeeId], [dateISO]: nextStatus ?? undefined },
    }));
    // A manual edit always overrides the auto-detected value going forward.
    setDerived((prev) => ({
      ...prev,
      [employeeId]: { ...prev[employeeId], [dateISO]: false },
    }));
    setPendingCells((prev) => new Set(prev).add(cellKey));

    startTransition(async () => {
      const result = await setAttendanceStatusAction(employeeId, dateISO, nextStatus);
      setPendingCells((prev) => {
        const next = new Set(prev);
        next.delete(cellKey);
        return next;
      });
      if (result?.error) {
        setStatuses((prev) => ({
          ...prev,
          [employeeId]: { ...prev[employeeId], [dateISO]: previous },
        }));
      }
    });
  }

  if (employees.length === 0) {
    return (
      <p className="px-4 py-6 text-sm text-black/50">
        No employees to show attendance for yet.
      </p>
    );
  }

  if (dates.length === 0) {
    return (
      <p className="px-4 py-6 text-sm text-black/50">
        No dates in the selected range.
      </p>
    );
  }

  const hasDerived = Object.values(derived).some((byDate) =>
    Object.values(byDate ?? {}).some(Boolean)
  );

  return (
    <>
      {hasDerived && (
        <p className="flex items-center gap-2 border-b border-black/10 px-4 py-2 text-xs text-black/50">
          <span className="inline-block h-3 w-3 rounded-sm border border-dashed border-black/30 bg-black/5" />
          Dashed = auto-detected from clock in/out. Pick a value to override.
        </p>
      )}
      <Table>
        <thead>
        <tr>
          <Th>Employee</Th>
          {dates.map((iso) => (
            <Th key={iso}>
              <span
                className={
                  isWeekendISO(iso) ? "text-black/30" : undefined
                }
              >
                {formatColumnHeader(iso)}
              </span>
            </Th>
          ))}
          <Th>No. of Days</Th>
          <Th>Worked</Th>
          <Th>Absences</Th>
        </tr>
      </thead>
      <tbody>
        {employees.map((employee) => {
          const employeeStatuses = statuses[employee.id] ?? {};
          const summary = computeAttendanceSummary(
            dates.map((d) => employeeStatuses[d])
          );
          return (
            <tr
              key={employee.id}
              className="border-t border-black/5"
            >
              <Td className="font-medium">{employee.name}</Td>
              {dates.map((iso) => {
                const value = employeeStatuses[iso] ?? "";
                const cellKey = `${employee.id}:${iso}`;
                const isDerived = Boolean(derived[employee.id]?.[iso]);
                return (
                  <Td key={iso}>
                    <select
                      value={value}
                      disabled={pendingCells.has(cellKey)}
                      onChange={(e) => handleChange(employee.id, iso, e.target.value)}
                      title={
                        isDerived
                          ? "Auto-detected from clock in/out — pick a value to override"
                          : undefined
                      }
                      className={`rounded border px-1.5 py-1 text-xs outline-none disabled:opacity-50 ${
                        isDerived
                          ? "border-dashed border-black/30 bg-black/5"
                          : "border-black/15 bg-white"
                      } ${
                        value === "ABSENT" ? "font-medium text-red-600" : ""
                      }`}
                    >
                      <option value="">—</option>
                      <option value="PRESENT">{ATTENDANCE_STATUS_LABELS.PRESENT}</option>
                      <option value="ABSENT">{ATTENDANCE_STATUS_LABELS.ABSENT}</option>
                      <option value="REST_DAY">{ATTENDANCE_STATUS_LABELS.REST_DAY}</option>
                    </select>
                  </Td>
                );
              })}
              <Td>{summary.noOfDays}</Td>
              <Td>{summary.worked}</Td>
              <Td>{summary.absences}</Td>
            </tr>
          );
        })}
      </tbody>
      </Table>
    </>
  );
}
