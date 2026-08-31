import type { Prisma } from "@/generated/prisma/client";
import type { ProfileFormValues } from "@/components/profile-form";
import type { ProfileViewUser } from "@/components/profile-view";

export const USER_PROFILE_INCLUDE = {
  manager: true,
  profile: { include: { dependents: { orderBy: { name: "asc" } } } },
} satisfies Prisma.UserInclude;

type UserWithProfile = Prisma.UserGetPayload<{
  include: typeof USER_PROFILE_INCLUDE;
}>;

export function toViewUser(user: UserWithProfile): ProfileViewUser {
  return {
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    manager: user.manager ? { name: user.manager.name } : null,
    profile: user.profile
      ? {
          ...user.profile,
          salaryUsd: user.profile.salaryUsd?.toString() ?? null,
          salaryPhp: user.profile.salaryPhp?.toString() ?? null,
        }
      : null,
  };
}

export function toFormValues(
  user: UserWithProfile
): Partial<ProfileFormValues> {
  const p = user.profile;
  return {
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    email: user.email,
    role: user.role,
    managerId: user.managerId ?? "",
    active: user.active,
    middleName: p?.middleName ?? "",
    salaryUsd: p?.salaryUsd?.toString() ?? "",
    salaryPhp: p?.salaryPhp?.toString() ?? "",
    birthDate: p?.birthDate ? p.birthDate.toISOString().slice(0, 10) : "",
    contactNumber: p?.contactNumber ?? "",
    homeAddress: p?.homeAddress ?? "",
    maritalStatus: p?.maritalStatus ?? "",
    spouseName: p?.spouseName ?? "",
    sssNo: p?.sssNo ?? "",
    tinNo: p?.tinNo ?? "",
    pagibigNo: p?.pagibigNo ?? "",
    bankName: p?.bankName ?? "",
    bankBranch: p?.bankBranch ?? "",
    bankAccountName: p?.bankAccountName ?? "",
    bankAccountNumber: p?.bankAccountNumber ?? "",
    bankType: p?.bankType ?? "",
    emergencyContactName: p?.emergencyContactName ?? "",
    emergencyContactNumber: p?.emergencyContactNumber ?? "",
    dependents:
      p?.dependents.map((d) => ({
        name: d.name,
        birthDate: d.birthDate ?? "",
      })) ?? [],
  };
}
