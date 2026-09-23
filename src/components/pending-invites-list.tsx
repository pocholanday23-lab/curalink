import { Badge, Button, Table, Td, Th } from "@/components/ui";
import { formatDate } from "@/lib/format";
import {
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
};

function isPast(date: Date): boolean {
  return date.getTime() < Date.now();
}

export function PendingInvitesList({ rows }: { rows: PendingInviteRow[] }) {
  if (rows.length === 0) return null;

  return (
    <Table>
      <thead>
        <tr>
          <Th>Email</Th>
          <Th>Manager</Th>
          <Th>Invited by</Th>
          <Th>Sent</Th>
          <Th>Expires</Th>
          <Th />
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const expired = isPast(r.expiresAt);
          return (
            <tr key={r.id} className="border-t border-black/5 dark:border-white/5">
              <Td>{r.email}</Td>
              <Td>{r.managerName ?? "—"}</Td>
              <Td>{r.invitedByName}</Td>
              <Td>{formatDate(r.createdAt)}</Td>
              <Td>
                <span className="inline-flex items-center gap-2">
                  {formatDate(r.expiresAt)}
                  {expired && <Badge tone="amber">Expired</Badge>}
                </span>
              </Td>
              <Td>
                <div className="flex gap-2">
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
                </div>
              </Td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}
