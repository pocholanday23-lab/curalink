"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { ClientInvoiceLine } from "@/lib/types";

function asJson(lines: ClientInvoiceLine[]): Prisma.InputJsonValue {
  return lines as unknown as Prisma.InputJsonValue;
}

export type InvoiceActionState = { error?: string } | undefined;

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  const s = v == null ? "" : String(v).trim();
  return s || null;
}

function readLines(formData: FormData): ClientInvoiceLine[] {
  const descs = formData.getAll("lineDescription").map(String);
  const covs = formData.getAll("lineCoverage").map(String);
  const amts = formData.getAll("lineAmount").map(String);
  const out: ClientInvoiceLine[] = [];
  for (let i = 0; i < descs.length; i++) {
    const description = descs[i]?.trim();
    if (!description) continue;
    const parsed = Number((amts[i] ?? "").replace(/[^0-9.\-]/g, ""));
    out.push({
      description,
      coverage: (covs[i] ?? "").trim(),
      amount: Number.isFinite(parsed) ? round2(parsed) : 0,
    });
  }
  return out;
}

type ParsedInvoice = {
  number: string;
  clientId: string;
  invoiceDate: Date;
  currency: string;
  billToName: string;
  billToAddress: string | null;
  coverageNote: string | null;
  notes: string | null;
  payPeriodIds: string[];
  lineItems: ClientInvoiceLine[];
  totalAmount: number;
};

async function parseInvoice(
  formData: FormData
): Promise<{ data?: ParsedInvoice; error?: string }> {
  const number = str(formData, "number");
  const clientId = str(formData, "clientId");
  const invoiceDateRaw = str(formData, "invoiceDate");

  if (!number) return { error: "Invoice number is required." };
  if (!clientId) return { error: "Select a client." };
  if (!invoiceDateRaw) return { error: "Invoice date is required." };

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) return { error: "Client not found." };

  const lineItems = readLines(formData);
  if (lineItems.length === 0) {
    return { error: "Add at least one line item." };
  }

  const payPeriodIds = formData.getAll("payPeriodId").map(String).filter(Boolean);

  return {
    data: {
      number,
      clientId,
      invoiceDate: new Date(invoiceDateRaw),
      currency: str(formData, "currency") ?? "USD",
      billToName: str(formData, "billToName") ?? client.name,
      billToAddress: str(formData, "billToAddress"),
      coverageNote: str(formData, "coverageNote"),
      notes: str(formData, "notes"),
      payPeriodIds,
      lineItems,
      totalAmount: round2(
        lineItems.reduce((sum, l) => sum + l.amount, 0)
      ),
    },
  };
}

export async function createInvoiceAction(
  _prevState: InvoiceActionState,
  formData: FormData
): Promise<InvoiceActionState> {
  await requireUser("ADMIN");

  const { data, error } = await parseInvoice(formData);
  if (error || !data) return { error };

  const clash = await prisma.clientInvoice.findUnique({
    where: { number: data.number },
  });
  if (clash) {
    return { error: `Invoice ${data.number} already exists.` };
  }

  const created = await prisma.clientInvoice.create({
    data: {
      number: data.number,
      clientId: data.clientId,
      invoiceDate: data.invoiceDate,
      currency: data.currency,
      billToName: data.billToName,
      billToAddress: data.billToAddress,
      coverageNote: data.coverageNote,
      notes: data.notes,
      payPeriodIds: data.payPeriodIds,
      lineItems: asJson(data.lineItems),
      totalAmount: data.totalAmount,
    },
  });

  revalidatePath("/admin/reports/invoices");
  redirect(`/admin/reports/invoices/${created.id}`);
}

export async function updateInvoiceAction(
  id: string,
  _prevState: InvoiceActionState,
  formData: FormData
): Promise<InvoiceActionState> {
  await requireUser("ADMIN");

  const existing = await prisma.clientInvoice.findUnique({ where: { id } });
  if (!existing) return { error: "Invoice not found." };

  const { data, error } = await parseInvoice(formData);
  if (error || !data) return { error };

  if (data.number !== existing.number) {
    const clash = await prisma.clientInvoice.findUnique({
      where: { number: data.number },
    });
    if (clash) return { error: `Invoice ${data.number} already exists.` };
  }

  await prisma.clientInvoice.update({
    where: { id },
    data: {
      number: data.number,
      clientId: data.clientId,
      invoiceDate: data.invoiceDate,
      currency: data.currency,
      billToName: data.billToName,
      billToAddress: data.billToAddress,
      coverageNote: data.coverageNote,
      notes: data.notes,
      payPeriodIds: data.payPeriodIds,
      lineItems: asJson(data.lineItems),
      totalAmount: data.totalAmount,
    },
  });

  revalidatePath("/admin/reports/invoices");
  revalidatePath(`/admin/reports/invoices/${id}`);
  redirect(`/admin/reports/invoices/${id}`);
}

export async function deleteInvoiceAction(id: string) {
  await requireUser("ADMIN");
  await prisma.clientInvoice.delete({ where: { id } });
  revalidatePath("/admin/reports/invoices");
  redirect("/admin/reports/invoices");
}
