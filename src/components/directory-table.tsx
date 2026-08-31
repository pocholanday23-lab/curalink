import Link from "next/link";
import { Badge, Table, Td, Th } from "@/components/ui";
import { formatMoneyPhp } from "@/lib/hr";
import { ImpersonateButton } from "@/components/impersonate-button";

export type DirectoryRow = {
  id: string;
  name: string;
  username: string;
  role: string;
  active: boolean;
  managerName: string | null;
  contactNumber: string | null;
  salaryPhp: string | number | null;
};

export function DirectoryTable({
  rows,
  basePath,
  showPay = true,
  showImpersonate = false,
}: {
  rows: DirectoryRow[];
  basePath: string;
  showPay?: boolean;
  showImpersonate?: boolean;
}) {
  const cols = 7 + (showPay ? 1 : 0) + (showImpersonate ? 1 : 0);

  return (
    <Table>
      <thead>
        <tr>
          <Th>Name</Th>
          <Th>Username</Th>
          <Th>Role</Th>
          <Th>Manager</Th>
          <Th>Contact</Th>
          {showPay && <Th>Monthly salary</Th>}
          <Th>Status</Th>
          {showImpersonate && <Th>Access</Th>}
          <Th />
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 && (
          <tr>
            <Td colSpan={cols} className="text-black/50">
              No employees yet.
            </Td>
          </tr>
        )}
        {rows.map((r) => (
          <tr key={r.id} className="border-t border-black/5 dark:border-white/5">
            <Td>{r.name}</Td>
            <Td>{r.username}</Td>
            <Td>{r.role}</Td>
            <Td>{r.managerName ?? "—"}</Td>
            <Td>{r.contactNumber ?? "—"}</Td>
            {showPay && (
              <Td>
                {r.salaryPhp != null ? formatMoneyPhp(r.salaryPhp) : "—"}
              </Td>
            )}
            <Td>
              <Badge tone={r.active ? "green" : "neutral"}>
                {r.active ? "Active" : "Inactive"}
              </Badge>
            </Td>
            {showImpersonate && (
              <Td>
                <ImpersonateButton
                  employeeId={r.id}
                  disabled={r.role === "ADMIN" || !r.active}
                />
              </Td>
            )}
            <Td>
              <Link
                href={`${basePath}/${r.id}`}
                className="font-medium underline underline-offset-2"
              >
                View
              </Link>
            </Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
