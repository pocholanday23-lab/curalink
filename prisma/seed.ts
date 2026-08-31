import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Seeding is a one-shot admin task — use the direct connection when available.
const connectionString =
  process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

/** UTC-midnight date helper. */
function d(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day));
}

type SeedProfile = {
  middleName?: string;
  salaryUsd?: number;
  salaryPhp?: number;
  birthDate?: Date;
  contactNumber?: string;
  homeAddress?: string;
  maritalStatus?: "SINGLE" | "MARRIED" | "SEPARATED" | "WIDOWED" | "DIVORCED";
  spouseName?: string;
  sssNo?: string;
  tinNo?: string;
  pagibigNo?: string;
  bankName?: string;
  bankBranch?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankType?: "SAVINGS" | "CHECKING";
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  dependents?: { name: string; birthDate?: string }[];
};

type SeedEmployee = {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  profile: SeedProfile;
};

// Data transcribed from the HR spreadsheet. Cells that were truncated or
// stored in Excel's scientific notation (long TIN / Pag-IBIG numbers) are left
// blank for completion through the UI.
const MANAGER: SeedEmployee = {
  username: "polanday",
  firstName: "Peter Ryan",
  lastName: "Olanday",
  email: "peterryanolanday@gmail.com",
  profile: {
    middleName: "Del Rosario",
    salaryUsd: 1500,
    salaryPhp: 90000,
    birthDate: d(1980, 11, 15),
    contactNumber: "09171325586",
    homeAddress: "Greenland Exec Village",
    maritalStatus: "MARRIED",
    spouseName: "Jayne Aguirang",
    sssNo: "3389860735",
    bankName: "UnionBank of the Philippines",
    bankBranch: "Meralco Ave Ortigas",
    bankAccountName: "Peter Ryan Olanday",
    bankType: "SAVINGS",
    emergencyContactName: "Knia Pablo",
    emergencyContactNumber: "09164529322",
    dependents: [
      { name: "Ryannah Olanday", birthDate: "May 20, 2002" },
      { name: "Joseph Olanday", birthDate: "Nov 24, 2003" },
      { name: "Robin Olanday", birthDate: "Nov 27, 2013" },
    ],
  },
};

const EMPLOYEES: SeedEmployee[] = [
  {
    username: "smacatangay",
    firstName: "Shirleen Joyce",
    lastName: "Macatangay",
    email: "shrlnmacatangay@gmail.com",
    profile: {
      middleName: "Bancoro",
      salaryUsd: 1000,
      salaryPhp: 60000,
      birthDate: d(1998, 7, 13),
      contactNumber: "09565204283",
      homeAddress: "Blk 5 Lt 3 Zechariah St.",
      maritalStatus: "SINGLE",
      sssNo: "3464991503",
      tinNo: "327452525",
      bankName: "Bank of the Philippine Islands",
      bankBranch: "Lipa Highway Branch",
      bankAccountName: "Shirleen Joyce B. Macatangay",
      bankAccountNumber: "0889433124",
      bankType: "SAVINGS",
      emergencyContactName: "Karl Garcia",
      emergencyContactNumber: "09162852565",
    },
  },
  {
    username: "kmauricio",
    firstName: "Kurt Russel",
    lastName: "Mauricio",
    email: "kurtrusselmauricio@gmail.com",
    profile: {
      middleName: "Deguit",
      salaryUsd: 800,
      salaryPhp: 48000,
      birthDate: d(2000, 2, 18),
      contactNumber: "09456303175",
      homeAddress: "Blk 3 Lot 3 Rosal Street",
      maritalStatus: "SINGLE",
      sssNo: "3513843065",
      bankName: "BPI",
      bankBranch: "Parola A. Bonifacio",
      bankAccountName: "Kurt Russel Mauricio",
      bankAccountNumber: "6376434845",
      bankType: "SAVINGS",
      emergencyContactName: "Timothy James Deguit Mauricio",
      emergencyContactNumber: "09933634498",
    },
  },
  {
    username: "kdayoc",
    firstName: "Khris",
    lastName: "Dayoc",
    email: "khrisdayoc@gmail.com",
    profile: {
      middleName: "Pancipanci",
      salaryUsd: 800,
      salaryPhp: 48000,
      birthDate: d(1992, 1, 14),
      contactNumber: "+6329620701864",
      homeAddress: "265 Gumamela 2 Phase",
      maritalStatus: "MARRIED",
      spouseName: "Donita Dayoc",
      sssNo: "3520009119",
      bankName: "Bank of the Philippine Islands",
      bankBranch: "BPI Masinag Branch",
      bankAccountName: "Khris Pancipanci Dayoc",
      bankAccountNumber: "9729262673",
      bankType: "SAVINGS",
      emergencyContactName: "Donita Dayoc",
      emergencyContactNumber: "+639627335145",
      dependents: [
        { name: "Elias Dayoc", birthDate: "05/22/2022" },
        { name: "Kayla Dayoc", birthDate: "03/15/2024" },
      ],
    },
  },
  {
    username: "emuncada",
    firstName: "Erin Karl",
    lastName: "Muncada",
    email: "erinkarl.muncada.ge2020@gmail.com",
    profile: {
      middleName: "Redondo",
      salaryUsd: 1000,
      salaryPhp: 60000,
      birthDate: d(1998, 3, 5),
      contactNumber: "09510841585",
      homeAddress: "78 Blue Palm St.",
      maritalStatus: "SINGLE",
      sssNo: "0641405420",
      bankName: "Digital Bank",
      bankAccountName: "Erin Karl Muncada",
      bankAccountNumber: "1382-6095-055",
      bankType: "SAVINGS",
      emergencyContactName: "Patricia Camisera",
      emergencyContactNumber: "09626031043",
    },
  },
  {
    username: "szapanta",
    firstName: "Shawn Kevin",
    lastName: "Zapanta",
    email: "shawnzapanta0490@gmail.com",
    profile: {
      middleName: "Garcia",
      salaryUsd: 1000,
      salaryPhp: 60000,
      birthDate: d(1996, 4, 9),
      contactNumber: "09165641994",
      homeAddress: "4766 Rd 4. V. Mapa St.",
      maritalStatus: "SINGLE",
      sssNo: "3459369360",
      bankName: "UnionBank of the Philippines",
      bankAccountName: "Shawn Kevin G. Zapanta",
      bankType: "SAVINGS",
      emergencyContactName: "Jessa Gorospe",
      emergencyContactNumber: "09391335536",
    },
  },
  {
    username: "kpablo",
    firstName: "Knia Gianine",
    lastName: "Pablo",
    email: "kniagianinepablo@gmail.com",
    profile: {
      middleName: "Isip",
      salaryUsd: 800,
      salaryPhp: 48000,
      birthDate: d(1989, 10, 2),
      contactNumber: "09164529322",
      homeAddress: "BLK 71 LOT 1 Hari Raya",
      maritalStatus: "SEPARATED",
      sssNo: "3429345903",
      tinNo: "941798086",
      bankName: "BDO",
      bankBranch: "BGC Ecotower",
      bankAccountName: "Knia Gianine Pablo",
      bankAccountNumber: "008160098265",
      bankType: "SAVINGS",
      emergencyContactName: "Peter Ryan Olanday",
      emergencyContactNumber: "09171325586",
      dependents: [
        { name: "Ervin Kale Isip Pablo" },
        { name: "Danica Erin Isip Pablo" },
      ],
    },
  },
  {
    username: "mchan",
    firstName: "Miles Jason",
    lastName: "Chan",
    email: "mileskie18@gmail.com",
    profile: {
      middleName: "Del Monte",
      salaryUsd: 800,
      salaryPhp: 48000,
      birthDate: d(1998, 3, 19),
      contactNumber: "09616614307",
      homeAddress: "Blk. 21 Lot 31. Sitio Maligaya",
      maritalStatus: "SINGLE",
      sssNo: "347849986",
      tinNo: "205366921",
      bankName: "Atome Savings",
      bankBranch: "Netbank Rural Bank",
      bankAccountName: "Miles Jason D. Chan",
      bankAccountNumber: "1770 6710 062427",
      bankType: "SAVINGS",
      emergencyContactName: "Maui Gail A. Dela Cruz",
      emergencyContactNumber: "09695174205",
      dependents: [
        {
          name: "Saoirse Agatha Dela Cruz Chan",
          birthDate: "October 17, 2025",
        },
      ],
    },
  },
  {
    username: "mcatoera",
    firstName: "Mark",
    lastName: "Catoera",
    email: "catoeramark49@gmail.com",
    profile: {
      middleName: "Camposano",
      salaryUsd: 1000,
      salaryPhp: 60000,
      birthDate: d(1976, 6, 30),
      contactNumber: "+639568220679",
      homeAddress: "Block 2 Lot 8 phase 2",
      maritalStatus: "SINGLE",
      sssNo: "3370827020",
      tinNo: "211379459",
      bankName: "Metrobank",
      bankBranch: "Manila East Road, Binangonan",
      bankAccountName: "Mark Camposano Catoera",
      bankAccountNumber: "345-3-34548658-6",
      bankType: "SAVINGS",
      emergencyContactName: "Rachel Catoera",
      emergencyContactNumber: "0942 672 2511",
    },
  },
];

function profileCreate(p: SeedProfile) {
  const { dependents, ...rest } = p;
  return {
    ...rest,
    ...(dependents && dependents.length > 0
      ? {
          dependents: {
            create: dependents.map((dep) => ({
              name: dep.name,
              birthDate: dep.birthDate ?? null,
            })),
          },
        }
      : {}),
  };
}

async function upsertPerson(
  person: SeedEmployee,
  role: "MANAGER" | "EMPLOYEE",
  passwordHash: string,
  managerId: string | null
) {
  const existing = await prisma.user.findUnique({
    where: { username: person.username },
    include: { profile: true },
  });

  if (existing) {
    if (existing.profile) {
      await prisma.dependent.deleteMany({
        where: { profileId: existing.profile.id },
      });
      await prisma.employeeProfile.delete({
        where: { id: existing.profile.id },
      });
    }
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        name: `${person.firstName} ${person.lastName}`,
        firstName: person.firstName,
        lastName: person.lastName,
        email: person.email,
        role,
        managerId,
        profile: { create: profileCreate(person.profile) },
      },
    });
  }

  return prisma.user.create({
    data: {
      name: `${person.firstName} ${person.lastName}`,
      firstName: person.firstName,
      lastName: person.lastName,
      username: person.username,
      email: person.email,
      passwordHash,
      mustChangePassword: true,
      role,
      managerId,
      profile: { create: profileCreate(person.profile) },
    },
  });
}

async function main() {
  const defaultPassword = await bcrypt.hash("password123", 10);
  const adminPassword = await bcrypt.hash("Pocholo40", 10);

  const admin = await prisma.user.upsert({
    where: { username: "pocholanday" },
    update: {
      name: "Pocholo Olanday",
      firstName: "Pocholo",
      lastName: "Olanday",
      email: "pocholanday23@gmail.com",
      role: "ADMIN",
    },
    create: {
      name: "Pocholo Olanday",
      firstName: "Pocholo",
      lastName: "Olanday",
      username: "pocholanday",
      email: "pocholanday23@gmail.com",
      passwordHash: adminPassword,
      mustChangePassword: false,
      role: "ADMIN",
    },
  });

  const manager = await upsertPerson(
    MANAGER,
    "MANAGER",
    defaultPassword,
    null
  );

  for (const employee of EMPLOYEES) {
    await upsertPerson(employee, "EMPLOYEE", defaultPassword, manager.id);
  }

  await prisma.client.upsert({
    where: { id: "seed-client-nimbus" },
    update: {},
    create: {
      id: "seed-client-nimbus",
      name: "Nimbus Retail",
      contactName: "Priya Nair",
      contactEmail: "priya@nimbusretail.example",
    },
  });

  await prisma.client.upsert({
    where: { id: "seed-client-solace" },
    update: {},
    create: {
      id: "seed-client-solace",
      name: "Solace Health",
      contactName: "Jordan Lee",
      contactEmail: "jordan@solacehealth.example",
    },
  });

  await prisma.cutoffConfig.upsert({
    where: { id: "seed-cutoff-config" },
    update: {},
    create: {
      id: "seed-cutoff-config",
      type: "SEMI_MONTHLY",
      anchorDate: new Date(),
      params: { payDelayDays: 5, periodLengthDays: 30 },
    },
  });

  await prisma.companySettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      name: "Curalink Management Incorporated",
      registrationId: "2026060253764-05",
      invoiceAddress:
        "2F Makati Central Square Building Fernando St. & Don Chino Roces Avenue, Makati City 1230, Metro Manila",
      payslipAddress:
        "2130 2nd Floor, Makati Cinema Square Mall, Fernando Street cor. Don Chino Roces, Pio del Pilar, City of Makati, Fourth District, National Capital Region (NCR), 1230",
      bankName: "Chinabank Savings",
      bankAccountName: "Curalink Management Incorporated",
      bankAccountNumber: "605552000969",
      bankBranch: "Marikina Gil Fernando Branch",
      bankAddress:
        "CTP BLDG. Gil Fernando Ave., San Roque, Marikina City, Philippines",
      swiftCode: "CHSVPHM1XXX",
      serviceChargePct: 10,
    },
  });

  console.log("Seed complete.");
  console.log(`  Admin:   ${admin.username} / Pocholo40`);
  console.log(`  Manager: ${manager.username} / password123 (change on first login)`);
  console.log("  Employees (all password123, change on first login):");
  for (const e of EMPLOYEES) {
    console.log(`    ${e.username}  (${e.firstName} ${e.lastName})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
