"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

export type ClientActionState = { error?: string } | undefined;

export async function createClientAction(
  _prevState: ClientActionState,
  formData: FormData
): Promise<ClientActionState> {
  await requireUser("ADMIN");

  const name = (formData.get("name") as string)?.trim();
  const contactName = (formData.get("contactName") as string)?.trim() || null;
  const contactEmail =
    (formData.get("contactEmail") as string)?.trim() || null;

  if (!name) {
    return { error: "Client name is required." };
  }

  await prisma.client.create({ data: { name, contactName, contactEmail } });

  revalidatePath("/admin/settings");
  revalidatePath("/admin/clients");
  redirect("/admin/settings");
}

export async function updateClientAction(
  id: string,
  _prevState: ClientActionState,
  formData: FormData
): Promise<ClientActionState> {
  await requireUser("ADMIN");

  const name = (formData.get("name") as string)?.trim();
  const contactName = (formData.get("contactName") as string)?.trim() || null;
  const contactEmail =
    (formData.get("contactEmail") as string)?.trim() || null;
  const active = formData.get("active") === "on";

  if (!name) {
    return { error: "Client name is required." };
  }

  await prisma.client.update({
    where: { id },
    data: { name, contactName, contactEmail, active },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/admin/clients");
  redirect("/admin/settings");
}
