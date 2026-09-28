import Link from "next/link";
import { Badge, Table, Td, Th } from "@/components/ui";
import { ImpersonateButton } from "@/components/impersonate-button";
import { EditIcon } from "@/components/ahora/icons";
import {
  ContractIconButton,
  type ContractListItem,
} from "@/components/admin/contract-icon-button";

export type DirectoryRow = {
  id: string;
  name: string;
  username: string;
  role: string;
  active: boolean;
  managerName: string | null;
  contracts?: ContractListItem[];
};

export function DirectoryTable({
  rows,
  basePath,
  showImpersonate = false,
  showContracts = false,
}: {
  rows: DirectoryRow[];
  basePath: string;
  showImpersonate?: boolean;
  showContracts?: boolean;
}) {
  const cols = 6 + (showImpersonate ? 1 : 0);

  return (
    <Table>
      <thead>
        <tr>
          <Th>Name</Th>
          <Th>Username</Th>
          <Th>Role</Th>
          <Th>Manager</Th>
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
          <tr key={r.id} className="border-t border-black/5">
            <Td>
              <Link href={`${basePath}/${r.id}`} className="hover:underline">
                {r.name}
              </Link>
            </Td>
            <Td>{r.username}</Td>
            <Td>{r.role}</Td>
            <Td>{r.managerName ?? "—"}</Td>
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
              <div className="flex items-center gap-1">
                <Link
                  href={`${basePath}/${r.id}/edit`}
                  title="Edit"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--ahora-chrome)] hover:bg-black/5 [&_svg]:h-[18px] [&_svg]:w-[18px]"
                >
                  <EditIcon />
                </Link>
                {showContracts && (
                  <ContractIconButton contracts={r.contracts ?? []} />
                )}
              </div>
            </Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
