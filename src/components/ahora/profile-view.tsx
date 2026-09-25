import type { ProfileViewUser } from "@/components/profile-view";
import { AhoraCard } from "@/components/ahora/ui";
import { formatDate } from "@/lib/format";
import {
  BANK_TYPE_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  formatMoneyPhp,
} from "@/lib/hr";

function labelFor<T extends { value: string; label: string }>(
  options: T[],
  value: string | null
) {
  return options.find((o) => o.value === value)?.label ?? value ?? "";
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <p className="mb-1.5">
      <span className="font-bold uppercase tracking-wide">{label}: </span>
      <span>{value || "—"}</span>
    </p>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 text-lg font-bold">{children}</h2>;
}

export function AhoraProfileView({ user }: { user: ProfileViewUser }) {
  const p = user.profile;

  return (
    <div className="flex flex-col gap-5">
      <AhoraCard>
        <div className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
          <div>
            <Field label="Full name" value={user.name} />
            <Field label="Role" value={user.role} />
            <Field label="Manager" value={user.manager?.name} />
          </div>
          <div>
            <Field label="Username" value={user.username} />
            <Field label="Email" value={user.email} />
          </div>
        </div>
      </AhoraCard>

      <AhoraCard>
        <CardTitle>Personal</CardTitle>
        <div className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
          <div>
            <Field label="First name" value={user.firstName} />
            <Field label="Middle name" value={p?.middleName} />
            <Field label="Last name" value={user.lastName} />
          </div>
          <div>
            <Field
              label="Birth date"
              value={p?.birthDate ? formatDate(p.birthDate) : ""}
            />
            <Field
              label="Marital status"
              value={labelFor(MARITAL_STATUS_OPTIONS, p?.maritalStatus ?? null)}
            />
            <Field label="Name of spouse" value={p?.spouseName} />
            <Field label="Contact number" value={p?.contactNumber} />
            <Field label="Home address" value={p?.homeAddress} />
          </div>
        </div>
      </AhoraCard>

      <AhoraCard>
        <CardTitle>Compensation</CardTitle>
        <Field
          label="Monthly salary"
          value={p?.salaryPhp != null ? formatMoneyPhp(p.salaryPhp) : ""}
        />
      </AhoraCard>

      <AhoraCard>
        <CardTitle>Government IDs</CardTitle>
        <div className="grid gap-x-8 gap-y-1 sm:grid-cols-3">
          <Field label="SSS No." value={p?.sssNo} />
          <Field label="TIN No." value={p?.tinNo} />
          <Field label="Pag-IBIG No." value={p?.pagibigNo} />
        </div>
      </AhoraCard>

      <AhoraCard>
        <CardTitle>Bank details</CardTitle>
        <div className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
          <Field label="Bank name" value={p?.bankName} />
          <Field label="Bank branch" value={p?.bankBranch} />
          <Field label="Account name" value={p?.bankAccountName} />
          <Field label="Account number" value={p?.bankAccountNumber} />
          <Field
            label="Account type"
            value={labelFor(BANK_TYPE_OPTIONS, p?.bankType ?? null)}
          />
        </div>
      </AhoraCard>

      <AhoraCard>
        <CardTitle>Emergency contact</CardTitle>
        <div className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
          <Field label="Contact person" value={p?.emergencyContactName} />
          <Field label="Mobile number" value={p?.emergencyContactNumber} />
        </div>
      </AhoraCard>

      <AhoraCard>
        <CardTitle>Dependents</CardTitle>
        {p && p.dependents.length > 0 ? (
          <ul className="flex flex-col gap-1">
            {p.dependents.map((d) => (
              <li key={d.id}>
                {d.name}
                {d.birthDate ? (
                  <span className="text-neutral-600"> — {d.birthDate}</span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-neutral-600">No dependents on file.</p>
        )}
      </AhoraCard>
    </div>
  );
}
