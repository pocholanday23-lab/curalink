"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { extractContractFields } from "@/lib/contract-extract";

export type ContractActionState = { error?: string; ok?: string } | undefined;

const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15MB

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  const s = v == null ? "" : String(v).trim();
  return s || null;
}

/** Best-effort: the client's name as a substring of the raw "End Client" cell text. */
async function matchClient(clientRaw: string | null) {
  if (!clientRaw) return null;
  const clients = await prisma.client.findMany({ select: { id: true, name: true } });
  const haystack = clientRaw.toLowerCase();
  return clients.find((c) => haystack.includes(c.name.toLowerCase())) ?? null;
}

/** Upload a signed contract PDF for an employee; best-effort field extraction. */
export async function uploadContractAction(
  employeeId: string,
  _prev: ContractActionState,
  formData: FormData
): Promise<ContractActionState> {
  const admin = await requireUser("ADMIN");

  const employee = await prisma.user.findUnique({ where: { id: employeeId } });
  if (!employee) return { error: "Employee not found." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a PDF file to upload." };
  }
  if (file.type && file.type !== "application/pdf") {
    return { error: "Only PDF files are supported." };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { error: "That file is too large (15MB max)." };
  }

  const arrayBuffer = await file.arrayBuffer();
  const fileData = Buffer.from(arrayBuffer);

  let extracted: Awaited<ReturnType<typeof extractContractFields>> | null = null;
  try {
    extracted = await extractContractFields(fileData);
  } catch (err) {
    // Extraction is best-effort; admin can fill the fields in by hand.
    console.error("[contract-extract] failed:", err);
    extracted = null;
  }

  const matchedClient = await matchClient(extracted?.clientRaw ?? null);

  await prisma.employeeContract.create({
    data: {
      employeeId,
      clientId: matchedClient?.id ?? null,
      clientNameRaw: extracted?.clientRaw ?? null,
      billRatePhp: extracted?.billRatePhp ?? null,
      contractStart: extracted?.contractStart ?? null,
      contractEnd: extracted?.contractEnd ?? null,
      fileName: file.name || "contract.pdf",
      fileType: file.type || "application/pdf",
      fileSize: file.size,
      fileData,
      uploadedById: admin.id,
    },
  });

  revalidatePath(`/admin/employees/${employeeId}/edit`);
  revalidatePath("/admin/employees");
  revalidatePath("/admin/settings");

  const foundSomething =
    matchedClient || extracted?.billRatePhp || extracted?.contractStart;
  return {
    ok: foundSomething
      ? "Contract uploaded. Review the extracted details below and correct anything that's off."
      : "Contract uploaded, but nothing could be auto-extracted from it — fill in the details below.",
  };
}

/** Correct a contract's extracted fields after the fact (no re-upload). */
export async function updateContractFieldsAction(
  contractId: string,
  _prev: ContractActionState,
  formData: FormData
): Promise<ContractActionState> {
  await requireUser("ADMIN");

  const contract = await prisma.employeeContract.findUnique({
    where: { id: contractId },
  });
  if (!contract) return { error: "Contract not found." };

  const clientId = str(formData, "clientId");
  const billRatePhpRaw = str(formData, "billRatePhp");
  const billRatePhp =
    billRatePhpRaw && Number.isFinite(Number(billRatePhpRaw))
      ? Number(billRatePhpRaw)
      : null;
  const contractStartRaw = str(formData, "contractStart");
  const contractEndRaw = str(formData, "contractEnd");

  await prisma.employeeContract.update({
    where: { id: contractId },
    data: {
      clientId: clientId || null,
      billRatePhp,
      contractStart: contractStartRaw ? new Date(contractStartRaw) : null,
      contractEnd: contractEndRaw ? new Date(contractEndRaw) : null,
    },
  });

  revalidatePath(`/admin/employees/${contract.employeeId}/edit`);
  revalidatePath("/admin/employees");
  revalidatePath("/admin/settings");
  return { ok: "Contract details updated." };
}

export async function deleteContractAction(contractId: string): Promise<void> {
  await requireUser("ADMIN");
  const contract = await prisma.employeeContract.findUnique({
    where: { id: contractId },
    select: { employeeId: true },
  });
  if (!contract) return;

  await prisma.employeeContract.delete({ where: { id: contractId } });

  revalidatePath(`/admin/employees/${contract.employeeId}/edit`);
  revalidatePath("/admin/employees");
  revalidatePath("/admin/settings");
}
