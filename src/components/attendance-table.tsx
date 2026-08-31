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
}: {
  employees: { id: string; name: string }[];
  dates: string[];
  initialStatuses: StatusMap;
}) {
  const [statuses, setStatuses] = useState<StatusMap>(initialStatuses);
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
      <p className="px-4 py-6 text-sm text-black/50 dark:text-white/50">
        No employees to show attendance for yet.
      </p>
    );
  }

  if (dates.length === 0) {
    return (
      <p className="px-4 py-6 text-sm text-black/50 dark:text-white/50">
        No dates in the selected range.
      </p>
    );
  }

  return (
    <Table>
      <thead>
        <tr>
          <Th>Employee</Th>
          {dates.map((iso) => (
            <Th key={iso}>
              <span
                className={
                  isWeekendISO(iso) ? "text-black/30 dark:text-white/30" : undefined
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
              className="border-t border-black/5 dark:border-white/5"
            >
              <Td className="font-medium">{employee.name}</Td>
              {dates.map((iso) => {
                const value = employeeStatuses[iso] ?? "";
                const cellKey = `${employee.id}:${iso}`;
                return (
                  <Td key={iso}>
                    <select
                      value={value}
                      disabled={pendingCells.has(cellKey)}
                      onChange={(e) => handleChange(employee.id, iso, e.target.value)}
                      className={`rounded border border-black/15 bg-white px-1.5 py-1 text-xs outline-none disabled:opacity-50 dark:border-white/20 dark:bg-black/20 ${
                        value === "ABSENT" ? "font-medium text-red-600 dark:text-red-400" : ""
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
  );
}
