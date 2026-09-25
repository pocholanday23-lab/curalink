"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/lib/actions/auth";
import { APP_TIME_ZONE } from "@/lib/format";
import {
  AttendanceIcon,
  CalendarIcon,
  ClientsIcon,
  HomeIcon,
  PayslipIcon,
  PhFlagIcon,
  ProfileIcon,
  ReportsIcon,
  SettingsIcon,
  TeamIcon,
} from "@/components/ahora/icons";
import { AhoraSectionTab } from "@/components/ahora/ui";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Icons are looked up by name rather than passed as component references —
 * Server Component layouts build the `links` array, and functions can't be
 * passed as props from a Server to a Client Component.
 */
const ICONS = {
  home: HomeIcon,
  calendar: CalendarIcon,
  payslip: PayslipIcon,
  profile: ProfileIcon,
  team: TeamIcon,
  attendance: AttendanceIcon,
  reports: ReportsIcon,
  settings: SettingsIcon,
  clients: ClientsIcon,
} as const;

export type AhoraIconName = keyof typeof ICONS;

export type AhoraLink = {
  href: string;
  label: string;
  icon: AhoraIconName;
  /** Adds a divider above this link — used to set off a distinct group. */
  newGroup?: boolean;
};

const SECTION_LABELS: [string, string][] = [
  ["/employee/time-card", "TIME CARD"],
  ["/employee/payslips", "PAYSLIPS"],
  ["/employee/profile", "PROFILE"],
  ["/employee", "HOME"],
];

function ahoraSectionLabel(pathname: string): string {
  for (const [prefix, label] of SECTION_LABELS) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) return label;
  }
  return "HOME";
}

/** Section tab (HOME / TIME CARD / ...) derived from the current route. Employee section only. */
export function AhoraAutoSectionTab() {
  const pathname = usePathname();
  return <AhoraSectionTab>{ahoraSectionLabel(pathname)}</AhoraSectionTab>;
}

/**
 * Dark-green icon rail. `labeled` shows a small caption under each icon —
 * used for Admin/Manager, which have more sections than the plain 4-icon
 * employee rail can carry without one.
 */
export function AhoraSidebar({
  links,
  labeled = false,
}: {
  links: AhoraLink[];
  labeled?: boolean;
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Sections"
      className={cx(
        "flex shrink-0 flex-col items-stretch gap-1 bg-[var(--ahora-chrome)] py-4 print:hidden",
        labeled ? "w-[84px] sm:w-[96px]" : "w-[76px] sm:w-[88px]"
      )}
    >
      {links.map((link) => {
        const active =
          pathname === link.href || pathname.startsWith(link.href + "/");
        const Icon = ICONS[link.icon];
        return (
          <Link
            key={link.href}
            href={link.href}
            title={link.label}
            aria-current={active ? "page" : undefined}
            className={cx(
              "group flex flex-col items-center gap-1 px-1 py-2",
              link.newGroup && "mt-3 border-t border-white/10 pt-3"
            )}
          >
            <span
              className={cx(
                "flex h-12 w-12 items-center justify-center rounded-full transition-colors",
                active
                  ? "bg-[var(--ahora-chrome-active)]"
                  : "group-hover:bg-white/10"
              )}
            >
              <Icon
                className={cx(
                  "h-6 w-6",
                  active ? "text-white" : "text-white/70"
                )}
              />
            </span>
            {labeled && (
              <span
                className={cx(
                  "text-center text-[10.5px] font-medium leading-tight",
                  active ? "text-white" : "text-white/70"
                )}
              >
                {link.label}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * The very first render's value inevitably differs between server and
 * client (it's "now"), so the clock text opts out of hydration matching
 * with suppressHydrationWarning rather than deferring state into an effect.
 */
function useManilaClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000 * 15);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function AhoraTopBar({
  userName,
  roleLabel,
}: {
  userName: string;
  roleLabel?: string;
}) {
  const now = useManilaClock();
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: APP_TIME_ZONE,
  }).format(now);
  const date = new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    timeZone: APP_TIME_ZONE,
  }).format(now);

  return (
    <header className="flex items-center justify-between gap-4 bg-[var(--ahora-chrome)] px-4 py-3 text-white print:hidden sm:px-6">
      <div className="flex items-center gap-2 sm:gap-3">
        <PhFlagIcon className="h-6 w-8 shrink-0 rounded-sm sm:h-7 sm:w-9" />
        <div className="leading-tight">
          <p className="text-base font-semibold sm:text-lg" suppressHydrationWarning>
            {time}
          </p>
          <p
            className="text-[11px] text-white/70 sm:text-xs"
            suppressHydrationWarning
          >
            {date}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center leading-none">
        <span className="text-xs font-medium uppercase tracking-wide text-white/60">
          Curalink
        </span>
        <span className="text-xl font-extrabold tracking-tight sm:text-2xl">
          Ahora
        </span>
      </div>

      <div className="flex items-center gap-3 text-right">
        <span className="hidden text-sm font-medium sm:inline">
          {userName}
          {roleLabel ? ` · ${roleLabel}` : ""}
        </span>
        <form action={signOutAction}>
          <button
            type="submit"
            className="text-sm text-white/80 underline underline-offset-2 hover:text-white"
          >
            Signout
          </button>
        </form>
      </div>
    </header>
  );
}
