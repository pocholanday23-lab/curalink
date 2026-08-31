import type { Dependent, EmployeeProfile } from "@/generated/prisma/client";
import { Card } from "@/components/ui";
import { formatDate } from "@/lib/format";
import {
  BANK_TYPE_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  formatMoneyPhp,
} from "@/lib/hr";

export type ProfileViewUser = {
  name: string;
  username: string;
  email: string;
  role: string;
  firstName: string | null;
  lastName: string | null;
  manager?: { name: string } | null;
  profile:
    | (Omit<EmployeeProfile, "salaryUsd" | "salaryPhp"> & {
        salaryUsd: string | number | null;
        salaryPhp: string | number | null;
        dependents: Dependent[];
      })
    | null;
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2">
      <dt className="text-xs font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">
        {label}
      </dt>
      <dd className="text-sm">{value || "—"}</dd>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <h2 className="mb-2 text-sm font-semibold">{title}</h2>
      <dl className="grid gap-x-6 sm:grid-cols-2">{children}</dl>
    </Card>
  );
}

function labelFor<T extends { value: string; label: string }>(
  options: T[],
  value: string | null
) {
  return options.find((o) => o.value === value)?.label ?? value ?? "";
}

export function ProfileView({ user }: { user: ProfileViewUser }) {
  const p = user.profile;

  return (
    <div className="flex flex-col gap-4">
      <Section title="Account">
        <Row label="Full name" value={user.name} />
        <Row label="Username" value={user.username} />
        <Row label="Email" value={user.email} />
        <Row label="Role" value={user.role} />
        <Row label="Manager" value={user.manager?.name} />
      </Section>

      <Section title="Personal">
        <Row label="First name" value={user.firstName} />
        <Row label="Middle name" value={p?.middleName} />
        <Row label="Last name" value={user.lastName} />
        <Row
          label="Birth date"
          value={p?.birthDate ? formatDate(p.birthDate) : ""}
        />
        <Row
          label="Marital status"
          value={labelFor(MARITAL_STATUS_OPTIONS, p?.maritalStatus ?? null)}
        />
        <Row label="Name of spouse" value={p?.spouseName} />
        <Row label="Contact number" value={p?.contactNumber} />
        <Row label="Home address" value={p?.homeAddress} />
      </Section>

      <Section title="Compensation">
        <Row
          label="Monthly salary"
          value={p?.salaryPhp != null ? formatMoneyPhp(p.salaryPhp) : ""}
        />
      </Section>

      <Section title="Government IDs">
        <Row label="SSS No." value={p?.sssNo} />
        <Row label="TIN No." value={p?.tinNo} />
        <Row label="Pag-IBIG No." value={p?.pagibigNo} />
      </Section>

      <Section title="Bank details">
        <Row label="Bank name" value={p?.bankName} />
        <Row label="Bank branch" value={p?.bankBranch} />
        <Row label="Account name" value={p?.bankAccountName} />
        <Row label="Account number" value={p?.bankAccountNumber} />
        <Row
          label="Account type"
          value={labelFor(BANK_TYPE_OPTIONS, p?.bankType ?? null)}
        />
      </Section>

      <Section title="Emergency contact">
        <Row label="Contact person" value={p?.emergencyContactName} />
        <Row label="Mobile number" value={p?.emergencyContactNumber} />
      </Section>

      <Card>
        <h2 className="mb-2 text-sm font-semibold">Dependents</h2>
        {p && p.dependents.length > 0 ? (
          <ul className="flex flex-col gap-1 text-sm">
            {p.dependents.map((d) => (
              <li key={d.id}>
                {d.name}
                {d.birthDate ? (
                  <span className="text-black/50 dark:text-white/50">
                    {" "}
                    — {d.birthDate}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-black/50 dark:text-white/50">
            No dependents on file.
          </p>
        )}
      </Card>
    </div>
  );
}
