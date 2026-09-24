import Link from "next/link";
import { Badge, Button, Table, Td, Th } from "@/components/ui";
import { formatDate } from "@/lib/format";
import {
  activateOnboardingInviteAction,
  cancelOnboardingInviteAction,
  resendOnboardingInviteAction,
} from "@/lib/actions/onboarding-invites";

export type PendingInviteRow = {
  id: string;
  email: string;
  managerName: string | null;
  invitedByName: string;
  createdAt: Date;
  expiresAt: Date;
  completedAt: Date | null;
  confirmedAt: Date | null;
};

function isPast(date: Date): boolean {
  return date.getTime() < Date.now();
}

export function PendingInvitesList({
  rows,
  reviewBasePath,
  canConfirm,
}: {
  rows: PendingInviteRow[];
  reviewBasePath: "/admin/employees" | "/manager/directory";
  /** Only admins can confirm a sign-up (assign client/salary, send contract). */
  canConfirm: boolean;
}) {
  if (rows.length === 0) return null;

  return (
    <Table>
      <thead>
        <tr>
          <Th>Email</Th>
          <Th>Manager</Th>
          <Th>Invited by</Th>
          <Th>Status</Th>
          <Th>Sent</Th>
          <Th />
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const expired = !r.completedAt && isPast(r.expiresAt);
          return (
            <tr key={r.id} className="border-t border-black/5 dark:border-white/5">
              <Td>{r.email}</Td>
              <Td>{r.managerName ?? "—"}</Td>
              <Td>{r.invitedByName}</Td>
              <Td>
                {!r.completedAt ? (
                  <span className="inline-flex items-center gap-2">
                    <Badge>Invited, sent {formatDate(r.createdAt)}</Badge>
                    {expired && <Badge tone="amber">Expired</Badge>}
                  </span>
                ) : !r.confirmedAt ? (
                  <Badge tone="amber">Needs review</Badge>
                ) : (
                  <Badge tone="amber">Confirmed — awaiting activation</Badge>
                )}
              </Td>
              <Td>{formatDate(r.createdAt)}</Td>
              <Td>
                <div className="flex flex-wrap gap-2">
                  {!r.completedAt && (
                    <>
                      <form action={resendOnboardingInviteAction.bind(null, r.id)}>
                        <Button type="submit" variant="secondary">
                          Resend
                        </Button>
                      </form>
                      <form action={cancelOnboardingInviteAction.bind(null, r.id)}>
                        <Button type="submit" variant="secondary">
                          Cancel
                        </Button>
                      </form>
                    </>
                  )}
                  {r.completedAt && !r.confirmedAt && (
                    <Link href={`${reviewBasePath}/onboarding/${r.id}`}>
                      <Button type="button" variant="secondary">
                        {canConfirm ? "Review & confirm" : "View"}
                      </Button>
                    </Link>
                  )}
                  {r.confirmedAt && (
                    <form action={activateOnboardingInviteAction.bind(null, r.id)}>
                      <Button type="submit">Activate</Button>
                    </form>
                  )}
                </div>
              </Td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}
