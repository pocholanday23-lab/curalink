import { requireUser } from "@/lib/dal";
import { Card, PageHeader } from "@/components/ui";
import { ClientForm } from "@/components/client-form";
import { createClientAction } from "@/lib/actions/clients";

export default async function NewClientPage() {
  await requireUser("ADMIN");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="New client" />
      <Card className="max-w-lg">
        <ClientForm mode="create" action={createClientAction} />
      </Card>
    </div>
  );
}
