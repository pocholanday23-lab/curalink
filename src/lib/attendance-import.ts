import "server-only";
import ExcelJS from "exceljs";
import type { AttendanceStatus } from "@/generated/prisma/enums";
import {
  enumerateDates,
  isWeekend,
  parseStatusCell,
  toDateOnlyUTC,
  toISODate,
} from "@/lib/attendance";

export interface ParsedAttendanceRow {
  fullName: string;
  statuses: Map<string, AttendanceStatus>;
}

export interface ParsedAttendanceWorkbook {
  dates: Date[];
  rows: ParsedAttendanceRow[];
  warnings: string[];
}

type Unwrapped = string | number | boolean | Date | null;

function unwrapCellValue(value: ExcelJS.CellValue): Unwrapped {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value;
  if (typeof value === "object") {
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((t) => t.text).join("");
    }
    if ("result" in value) {
      return unwrapCellValue(value.result as ExcelJS.CellValue);
    }
    if ("text" in value) {
      return String(value.text);
    }
    return null;
  }
  return value;
}

function parseHeaderDate(
  value: ExcelJS.CellValue,
  fallbackYear: number | null,
  warnings: string[],
  address: string
): Date | null {
  const effective = unwrapCellValue(value);
  if (effective instanceof Date) return toDateOnlyUTC(effective);
  if (effective === null) return null;

  const text = String(effective).trim();
  if (!text) return null;

  if (/\d{4}/.test(text)) {
    const parsed = new Date(text);
    if (!Number.isNaN(parsed.getTime())) return toDateOnlyUTC(parsed);
  }

  const match =
    text.match(/^(\d{1,2})[-\/\s]([A-Za-z]{3,})$/) ??
    text.match(/^([A-Za-z]{3,})[-\/\s](\d{1,2})$/);
  if (match && fallbackYear) {
    const [, a, b] = match;
    const isFirstNumeric = /^\d+$/.test(a);
    const day = Number(isFirstNumeric ? a : b);
    const monthName = isFirstNumeric ? b : a;
    const parsed = new Date(`${monthName} ${day}, ${fallbackYear}`);
    if (!Number.isNaN(parsed.getTime())) return toDateOnlyUTC(parsed);
  }

  warnings.push(`Could not parse date header "${text}" (cell ${address}).`);
  return null;
}

/**
 * Parses an attendance workbook shaped like: Last Name | First Name | <date columns...> | No. of Days | Worked | Absences.
 * Saturdays/Sundays missing from the date columns are synthesized as REST_DAY for every employee.
 */
export async function parseAttendanceWorkbook(
  buffer: ArrayBuffer,
  options: { fallbackYear?: number } = {}
): Promise<ParsedAttendanceWorkbook> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) {
    return { dates: [], rows: [], warnings: ["The workbook has no sheets."] };
  }

  const warnings: string[] = [];
  const fallbackYear = options.fallbackYear ?? null;

  let headerRowNumber: number | null = null;
  let lastNameCol = -1;
  let firstNameCol = -1;
  sheet.eachRow((row, rowNumber) => {
    if (headerRowNumber) return;
    let foundLast = -1;
    let foundFirst = -1;
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const text = String(unwrapCellValue(cell.value) ?? "")
        .trim()
        .toLowerCase();
      if (text === "last name") foundLast = colNumber;
      if (text === "first name") foundFirst = colNumber;
    });
    if (foundLast > 0 && foundFirst > 0) {
      headerRowNumber = rowNumber;
      lastNameCol = foundLast;
      firstNameCol = foundFirst;
    }
  });

  if (headerRowNumber === null) {
    return {
      dates: [],
      rows: [],
      warnings: [
        'Could not find a header row with "Last Name" and "First Name" columns.',
      ],
    };
  }

  const headerRow = sheet.getRow(headerRowNumber);
  const lastCol = sheet.actualColumnCount;

  let summaryStartCol = lastCol + 1;
  for (let col = firstNameCol + 1; col <= lastCol; col++) {
    const text = String(unwrapCellValue(headerRow.getCell(col).value) ?? "")
      .trim()
      .toLowerCase();
    if (/no\.?\s*of\s*days|worked|absences/.test(text)) {
      summaryStartCol = col;
      break;
    }
  }

  const dateColumns: { col: number; date: Date }[] = [];
  for (let col = firstNameCol + 1; col < summaryStartCol; col++) {
    const cell = headerRow.getCell(col);
    const date = parseHeaderDate(cell.value, fallbackYear, warnings, cell.address);
    if (date) dateColumns.push({ col, date });
  }

  if (dateColumns.length === 0) {
    return {
      dates: [],
      rows: [],
      warnings: [
        ...warnings,
        "No date columns were found between the name columns and the summary columns.",
      ],
    };
  }

  const rows: ParsedAttendanceRow[] = [];
  for (let r = headerRowNumber + 1; r <= sheet.actualRowCount; r++) {
    const row = sheet.getRow(r);
    const lastName = String(unwrapCellValue(row.getCell(lastNameCol).value) ?? "").trim();
    const firstName = String(unwrapCellValue(row.getCell(firstNameCol).value) ?? "").trim();
    if (!lastName && !firstName) continue;

    const fullName = `${firstName} ${lastName}`.trim();
    const statuses = new Map<string, AttendanceStatus>();
    for (const { col, date } of dateColumns) {
      const effective = unwrapCellValue(row.getCell(col).value);
      const parsed = parseStatusCell(effective);
      if (parsed === "UNKNOWN") {
        warnings.push(
          `Unrecognized status "${String(effective)}" for ${fullName} on ${toISODate(date)}.`
        );
        continue;
      }
      if (parsed) {
        statuses.set(toISODate(date), parsed);
      }
    }
    rows.push({ fullName, statuses });
  }

  if (rows.length === 0) {
    return {
      dates: [],
      rows: [],
      warnings: [...warnings, "No employee rows were found below the header."],
    };
  }

  const parsedDates = dateColumns.map((d) => d.date);
  const minDate = parsedDates.reduce((a, b) => (a.getTime() < b.getTime() ? a : b));
  const maxDate = parsedDates.reduce((a, b) => (a.getTime() > b.getTime() ? a : b));
  const parsedISOs = new Set(parsedDates.map(toISODate));

  const dates: Date[] = [];
  for (const date of enumerateDates(minDate, maxDate)) {
    const iso = toISODate(date);
    if (parsedISOs.has(iso)) {
      dates.push(date);
      continue;
    }
    if (isWeekend(date)) {
      dates.push(date);
      for (const row of rows) {
        row.statuses.set(iso, "REST_DAY");
      }
    } else {
      warnings.push(`No column for ${iso} — it was left out of the imported range.`);
    }
  }

  return { dates, rows, warnings };
}
