import "server-only";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { PDFParse } from "pdf-parse";
import { GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";

/**
 * pdf-parse (via pdfjs-dist) defaults to importing its worker script
 * relative to its own bundled location. Turbopack's server bundle doesn't
 * emit that sibling file, so the default "fake worker" fallback fails with
 * "Cannot find module .../pdf.worker.mjs". Pointing workerSrc at the real
 * on-disk file (as a file:// URL, resolved outside the bundler) sidesteps
 * that — pdfjs's dynamic import() then hits Node's own loader instead of
 * Turbopack's module graph. `PDFParse.setWorker()` doesn't reliably reach
 * the same GlobalWorkerOptions instance pdf-parse's ESM build imports under
 * Turbopack, so it's set directly here instead.
 */
let workerConfigured = false;
function ensureWorkerConfigured() {
  if (workerConfigured) return;
  const workerPath = path.join(
    process.cwd(),
    "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"
  );
  GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;
  workerConfigured = true;
}

export type ExtractedContract = {
  /** Raw "End Client" cell text, address and all — matched against Client names by the caller. */
  clientRaw: string | null;
  contractStart: Date | null;
  contractEnd: Date | null;
  billRatePhp: number | null;
  /** Full extracted text, kept for debugging/manual review. */
  rawText: string;
};

const LABELS = [
  "Independent Contractor's Tools",
  "Incentive / Commission",
  "Independent Contractor",
  "Engagement Period",
  "Engagement Type",
  "Services / Deliverables",
  "Payment Terms",
  "Governing Law",
  "Service Fee",
  "End Client",
  "Company",
];

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Text between a label and whichever known label comes next (or end of text). */
function captureAfterLabel(text: string, label: string): string | null {
  const stopPattern = LABELS.filter((l) => l !== label)
    .map(escapeRe)
    .join("|");
  const re = new RegExp(
    `${escapeRe(label)}\\s*[:\\-]?\\s*([\\s\\S]*?)(?=(?:${stopPattern})|$)`,
    "i"
  );
  const m = text.match(re);
  if (!m) return null;
  const value = m[1].replace(/\s+/g, " ").trim();
  return value || null;
}

/**
 * `new Date("July 27, 2026")` parses as local time, so reading it back with
 * UTC getters can land on the wrong calendar day depending on the server's
 * timezone. Read with local getters, then rebuild in UTC (same fix as
 * src/lib/attendance-import.ts's parseHeaderDate).
 */
function parseDateLoose(text: string): Date | null {
  const parsed = new Date(text.trim());
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(
    Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())
  );
}

function extractEngagementDates(periodText: string | null): {
  start: Date | null;
  end: Date | null;
} {
  if (!periodText) return { start: null, end: null };

  // The stop lookahead anchors on "unless"/"continuing", not a bare comma —
  // a "Month Day, Year" date already contains a comma, which would
  // otherwise truncate the match before the year.
  const fromTo = periodText.match(
    /from\s+(.+?)\s+to\s+(.+?)(?:,?\s+unless|,?\s+continuing|$)/i
  );
  if (fromTo) {
    return {
      start: parseDateLoose(fromTo[1]),
      end: parseDateLoose(fromTo[2]),
    };
  }

  const startingOnly = periodText.match(
    /starting\s+(.+?)(?:,?\s+continuing|$)/i
  );
  if (startingOnly) {
    return { start: parseDateLoose(startingOnly[1]), end: null };
  }

  return { start: null, end: null };
}

function extractBillRatePhp(feeText: string | null): number | null {
  if (!feeText) return null;
  const match = feeText.match(/₱\s*([\d,]+(?:\.\d+)?)/);
  if (!match) return null;
  const n = Number(match[1].replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

export async function extractContractFields(
  fileData: Buffer
): Promise<ExtractedContract> {
  ensureWorkerConfigured();
  const parser = new PDFParse({ data: fileData });
  let rawText = "";
  try {
    const result = await parser.getText();
    rawText = result.text ?? "";
  } finally {
    await parser.destroy();
  }

  const clientRaw = captureAfterLabel(rawText, "End Client");
  const periodText = captureAfterLabel(rawText, "Engagement Period");
  const feeText = captureAfterLabel(rawText, "Service Fee");

  const { start, end } = extractEngagementDates(periodText);

  return {
    clientRaw,
    contractStart: start,
    contractEnd: end,
    billRatePhp: extractBillRatePhp(feeText),
    rawText,
  };
}
