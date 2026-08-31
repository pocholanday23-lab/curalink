import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { Badge, Button, Card, PageHeader, Table, Td, Th } from "@/components/ui";
import { CutoffConfigForm } from "@/components/cutoff-config-form";
import { GeneratePeriodsForm } from "@/components/generate-periods-form";
import { closePeriodAction, reopenPeriodAction } from "@/lib/actions/pay-periods";
import { formatDate, formatDateRange } from "@/lib/format";

export default async function AdminPayPeriodsPage() {
  await requireUser("ADMIN");

  const [config, periods] = await Promise.all([
    prisma.cutoffConfig.findFirst(),
    prisma.payPeriod.findMany({ orderBy: { startDate: "desc" } }),
  ]);

  const params = config?.params as
    | { payDelayDays?: number; periodLengthDays?: number }
    | null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Pay periods"
        description="Configure your cut-off schedule and generate upcoming pay periods."
      />

      <Card className="max-w-lg">
        <h2 className="mb-4 text-sm font-semibold">Cut-off schedule</h2>
        <CutoffConfigForm
          defaultValues={
            config
              ? {
                  type: config.type,
                  anchorDate: config.anchorDate,
                  payDelayDays: params?.payDelayDays ?? 5,
                  periodLengthDays: params?.periodLengthDays ?? 30,
                }
              : undefined
          }
        />
      </Card>

      {config && (
        <Card>
          <h2 className="mb-4 text-sm font-semibold">Generate periods</h2>
          <GeneratePeriodsForm />
        </Card>
      )}

      <Card className="p-0">
        <Table>
          <thead>
            <tr>
              <Th>Period</Th>
              <Th>Pay date</Th>
              <Th>Status</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {periods.length === 0 && (
              <tr>
                <Td colSpan={4} className="text-black/50">
                  No pay periods generated yet.
                </Td>
              </tr>
            )}
            {periods.map((p) => (
              <tr
                key={p.id}
                className="border-t border-black/5 dark:border-white/5"
              >
                <Td>{formatDateRange(p.startDate, p.endDate)}</Td>
                <Td>{formatDate(p.payDate)}</Td>
                <Td>
                  <Badge tone={p.status === "OPEN" ? "amber" : "green"}>
                    {p.status}
                  </Badge>
                </Td>
                <Td>
                  {p.status === "OPEN" ? (
                    <form action={closePeriodAction.bind(null, p.id)}>
                      <Button type="submit" variant="secondary">
                        Close period
                      </Button>
                    </form>
                  ) : (
                    <form action={reopenPeriodAction.bind(null, p.id)}>
                      <Button type="submit" variant="secondary">
                        Reopen
                      </Button>
                    </form>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
