import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return new Response("Forbidden", { status: 403 });
  }

  const { id } = await params;
  const contract = await prisma.employeeContract.findUnique({
    where: { id },
    select: { fileData: true, fileType: true, fileName: true },
  });
  if (!contract) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(new Uint8Array(contract.fileData), {
    headers: {
      "Content-Type": contract.fileType || "application/pdf",
      "Content-Disposition": `inline; filename="${contract.fileName.replace(/"/g, "")}"`,
      "Cache-Control": "private, max-age=0, no-cache",
    },
  });
}
