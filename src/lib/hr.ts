import type {
  BankAccountType,
  MaritalStatus,
} from "@/generated/prisma/enums";

export const MARITAL_STATUS_OPTIONS: { value: MaritalStatus; label: string }[] =
  [
    { value: "SINGLE", label: "Single" },
    { value: "MARRIED", label: "Married" },
    { value: "SEPARATED", label: "Separated" },
    { value: "WIDOWED", label: "Widowed" },
    { value: "DIVORCED", label: "Divorced" },
  ];

export const BANK_TYPE_OPTIONS: { value: BankAccountType; label: string }[] = [
  { value: "SAVINGS", label: "Savings" },
  { value: "CHECKING", label: "Checking" },
];

/** Scalar profile fields an employee may edit about themselves. */
export const SELF_EDITABLE_FIELDS = [
  "middleName",
  "birthDate",
  "contactNumber",
  "homeAddress",
  "maritalStatus",
  "spouseName",
  "sssNo",
  "tinNo",
  "pagibigNo",
  "bankName",
  "bankBranch",
  "bankAccountName",
  "bankAccountNumber",
  "bankType",
  "emergencyContactName",
  "emergencyContactNumber",
] as const;

export function parseMaritalStatus(
  raw: unknown
): MaritalStatus | null {
  if (raw == null) return null;
  const t = String(raw).trim().toUpperCase();
  if (!t || t === "N/A" || t === "NA") return null;
  const match = MARITAL_STATUS_OPTIONS.find((o) => o.value === t);
  return match ? match.value : null;
}

export function parseBankType(raw: unknown): BankAccountType | null {
  if (raw == null) return null;
  const t = String(raw).trim().toUpperCase();
  if (t.startsWith("SAV")) return "SAVINGS";
  if (t.startsWith("CHE") || t.startsWith("CHK") || t.startsWith("CUR")) {
    return "CHECKING";
  }
  return null;
}

/** "$ 1,000.00", "PHP 60,000.00", 48000 -> number | null */
export function parseMoney(raw: unknown): number | null {
  if (raw == null || raw === "") return null;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  const cleaned = String(raw).replace(/[^0-9.\-]/g, "");
  if (!cleaned || cleaned === "-" || cleaned === ".") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

const MONTHS =
  "january february march april may june july august september october november december".split(
    " "
  );

/**
 * Loose date parser for the assorted formats in the HR sheet:
 * "07/13/1998", "02-18-2000", "April 09, 1996", "11/15/1980", ISO strings.
 * Returns a UTC-midnight Date or null.
 */
export function parseDateLoose(raw: unknown): Date | null {
  if (raw == null || raw === "") return null;
  if (raw instanceof Date) {
    return Number.isNaN(raw.getTime())
      ? null
      : new Date(
          Date.UTC(raw.getFullYear(), raw.getMonth(), raw.getDate())
        );
  }
  const text = String(raw).trim();
  if (!text) return null;

  // ISO yyyy-mm-dd
  const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    return utc(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  }

  // m/d/yyyy or m-d-yyyy
  const mdy = text.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (mdy) {
    let year = Number(mdy[3]);
    if (year < 100) year += year < 50 ? 2000 : 1900;
    return utc(year, Number(mdy[1]), Number(mdy[2]));
  }

  // "Month d, yyyy" / "Month d yyyy" / "d Month yyyy"
  const words = text.toLowerCase().replace(/,/g, "").split(/\s+/);
  let monthIndex = -1;
  let day = NaN;
  let year = NaN;
  for (const w of words) {
    const mi = MONTHS.findIndex((m) => m.startsWith(w) && w.length >= 3);
    if (mi >= 0 && monthIndex < 0) {
      monthIndex = mi;
      continue;
    }
    const n = Number(w);
    if (!Number.isNaN(n)) {
      if (n > 31) year = n;
      else if (Number.isNaN(day)) day = n;
      else year = n;
    }
  }
  if (monthIndex >= 0 && !Number.isNaN(day) && !Number.isNaN(year)) {
    return utc(year, monthIndex + 1, day);
  }

  const fallback = new Date(text);
  return Number.isNaN(fallback.getTime())
    ? null
    : utc(
        fallback.getFullYear(),
        fallback.getMonth() + 1,
        fallback.getDate()
      );
}

function utc(year: number, month: number, day: number): Date | null {
  const d = new Date(Date.UTC(year, month - 1, day));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatMoneyPhp(amount: number | string | null | undefined) {
  if (amount == null || amount === "") return "—";
  const value = typeof amount === "string" ? Number(amount) : amount;
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(value);
}
