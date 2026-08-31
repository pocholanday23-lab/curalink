import "server-only";
import ExcelJS from "exceljs";
import type { BankAccountType, MaritalStatus } from "@/generated/prisma/enums";
import {
  parseBankType,
  parseDateLoose,
  parseMaritalStatus,
  parseMoney,
} from "@/lib/hr";

export interface ParsedEmployeeRow {
  firstName: string;
  lastName: string;
  middleName: string | null;
  email: string | null;
  salaryUsd: number | null;
  salaryPhp: number | null;
  birthDate: Date | null;
  contactNumber: string | null;
  homeAddress: string | null;
  maritalStatus: MaritalStatus | null;
  spouseName: string | null;
  sssNo: string | null;
  tinNo: string | null;
  pagibigNo: string | null;
  bankName: string | null;
  bankBranch: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  bankType: BankAccountType | null;
  emergencyContactName: string | null;
  emergencyContactNumber: string | null;
  dependents: { name: string; birthDate: string | null }[];
}

export interface ParsedEmployeeWorkbook {
  rows: ParsedEmployeeRow[];
  warnings: string[];
}

type ImportField = Exclude<keyof ParsedEmployeeRow, "dependents">;

function unwrapCellValue(value: ExcelJS.CellValue): string | number | Date | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value;
  if (typeof value === "object") {
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((t) => t.text).join("");
    }
    if ("result" in value) {
      return unwrapCellValue(value.result as ExcelJS.CellValue);
    }
    if ("text" in value) return String((value as { text: unknown }).text);
    if ("hyperlink" in value) {
      return String((value as { text?: unknown }).text ?? "");
    }
    return null;
  }
  if (typeof value === "boolean") return null;
  return value;
}

function cellString(value: ExcelJS.CellValue): string {
  const v = unwrapCellValue(value);
  if (v === null) return "";
  if (v instanceof Date) return v.toISOString();
  return String(v).trim();
}

function normHeader(text: string): string {
  return text
    .toLowerCase()
    .replace(/[._]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[:()]/g, "")
    .trim();
}

/** Maps a normalized header to a field name, "dependent", or null. */
function classifyHeader(h: string): ImportField | "dependent" | null {
  if (h.startsWith("child")) return "dependent";

  if (h.includes("emergency")) {
    if (/(mobile|number|contact no|phone|cell)/.test(h)) {
      return "emergencyContactNumber";
    }
    return "emergencyContactName";
  }

  if (h === "last name" || h === "surname") return "lastName";
  if (h === "first name" || h === "given name") return "firstName";
  if (h === "middle name" || h === "middle initial") return "middleName";
  if (h.includes("salary") && h.includes("usd")) return "salaryUsd";
  if (h.includes("salary") && h.includes("php")) return "salaryPhp";
  if (h.includes("salary")) return "salaryPhp";
  if (h.includes("birth") || h === "dob" || h.includes("date of birth")) {
    return "birthDate";
  }
  if (h.includes("marital")) return "maritalStatus";
  if (h.includes("spouse")) return "spouseName";
  if (h.includes("home address") || h === "address") return "homeAddress";
  if (h.includes("sss")) return "sssNo";
  if (h === "tin no" || h === "tin number" || h === "tin") return "tinNo";
  if (h.includes("pagibig") || h.includes("pag ibig") || h.includes("hdmf")) {
    return "pagibigNo";
  }
  if (h.includes("bank branch")) return "bankBranch";
  if (h.includes("bank name")) return "bankName";
  if (h.includes("account name")) return "bankAccountName";
  if (h.includes("account number") || h.includes("account no")) {
    return "bankAccountNumber";
  }
  if (h.includes("bank type") || h.includes("account type")) return "bankType";
  if (h.includes("bank")) return "bankName";
  if (h.includes("email") || h.includes("e mail")) return "email";
  if (h.includes("contact number") || h.includes("contact no")) {
    return "contactNumber";
  }
  if (h.includes("mobile") || h === "phone" || h === "cell") {
    return "contactNumber";
  }
  return null;
}

const DATE_IN_TEXT =
  /(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})|((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2}(?:,?\s*\d{4})?)|(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{4})/i;

function splitDependent(text: string): { name: string; birthDate: string | null } | null {
  const t = text.trim().replace(/\s+/g, " ");
  if (!t || /^n\/?a$/i.test(t)) return null;
  const m = t.match(DATE_IN_TEXT);
  if (m && m.index !== undefined) {
    const name = t
      .slice(0, m.index)
      .replace(/[\s,\-–—:]+$/, "")
      .trim();
    const birthDate = t.slice(m.index).replace(/^[\s,\-–—:]+/, "").trim();
    return { name: name || t, birthDate: birthDate || null };
  }
  return { name: t, birthDate: null };
}

export async function parseEmployeeWorkbook(
  buffer: ArrayBuffer
): Promise<ParsedEmployeeWorkbook> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const warnings: string[] = [];
  const merged = new Map<string, ParsedEmployeeRow>();
  const order: string[] = [];

  const blank = (): ParsedEmployeeRow => ({
    firstName: "",
    lastName: "",
    middleName: null,
    email: null,
    salaryUsd: null,
    salaryPhp: null,
    birthDate: null,
    contactNumber: null,
    homeAddress: null,
    maritalStatus: null,
    spouseName: null,
    sssNo: null,
    tinNo: null,
    pagibigNo: null,
    bankName: null,
    bankBranch: null,
    bankAccountName: null,
    bankAccountNumber: null,
    bankType: null,
    emergencyContactName: null,
    emergencyContactNumber: null,
    dependents: [],
  });

  let sheetsMatched = 0;

  for (const sheet of workbook.worksheets) {
    let headerRowNumber = -1;
    const fieldCols = new Map<number, ImportField>();
    const dependentCols: number[] = [];
    let firstNameCol = -1;
    let lastNameCol = -1;

    sheet.eachRow((row, rowNumber) => {
      if (headerRowNumber > 0) return;
      const cols = new Map<number, ImportField>();
      const deps: number[] = [];
      let fCol = -1;
      let lCol = -1;
      row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        const h = normHeader(cellString(cell.value));
        if (!h) return;
        const kind = classifyHeader(h);
        if (kind === "dependent") deps.push(colNumber);
        else if (kind === "firstName") fCol = colNumber;
        else if (kind === "lastName") lCol = colNumber;
        else if (kind) cols.set(colNumber, kind);
      });
      if (fCol > 0 && lCol > 0) {
        headerRowNumber = rowNumber;
        firstNameCol = fCol;
        lastNameCol = lCol;
        for (const [c, k] of cols) fieldCols.set(c, k);
        dependentCols.push(...deps);
      }
    });

    if (headerRowNumber < 0) continue;
    sheetsMatched += 1;

    for (let r = headerRowNumber + 1; r <= sheet.actualRowCount; r++) {
      const row = sheet.getRow(r);
      const firstName = cellString(row.getCell(firstNameCol).value);
      const lastName = cellString(row.getCell(lastNameCol).value);
      if (!firstName && !lastName) continue;

      const key = `${firstName}|${lastName}`.toLowerCase();
      let record = merged.get(key);
      if (!record) {
        record = blank();
        record.firstName = firstName;
        record.lastName = lastName;
        merged.set(key, record);
        order.push(key);
      }

      for (const [col, field] of fieldCols) {
        const raw = unwrapCellValue(row.getCell(col).value);
        if (raw === null || String(raw).trim() === "") continue;
        const text = String(raw).trim();
        if (/^n\/?a$/i.test(text)) continue;

        switch (field) {
          case "salaryUsd":
          case "salaryPhp":
            record[field] = parseMoney(raw);
            break;
          case "birthDate": {
            const d = parseDateLoose(raw);
            if (d) record.birthDate = d;
            else warnings.push(`Could not parse birth date "${text}" for ${firstName} ${lastName}.`);
            break;
          }
          case "maritalStatus": {
            const ms = parseMaritalStatus(text);
            if (ms) record.maritalStatus = ms;
            else warnings.push(`Unrecognized marital status "${text}" for ${firstName} ${lastName}.`);
            break;
          }
          case "bankType": {
            record.bankType = parseBankType(text);
            break;
          }
          default:
            record[field] = text;
        }
      }

      for (const col of dependentCols) {
        const dep = splitDependent(cellString(row.getCell(col).value));
        if (dep && !record.dependents.some((d) => d.name === dep.name)) {
          record.dependents.push(dep);
        }
      }
    }
  }

  if (sheetsMatched === 0) {
    return {
      rows: [],
      warnings: [
        'Could not find a sheet with "First Name" and "Last Name" header columns.',
      ],
    };
  }

  const rows = order
    .map((k) => merged.get(k)!)
    .filter((row) => row.firstName && row.lastName);

  return { rows, warnings };
}
