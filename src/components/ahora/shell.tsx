"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/lib/actions/auth";
import { APP_TIME_ZONE } from "@/lib/format";
import {
  CalendarIcon,
  HomeIcon,
  PayslipIcon,
  PhFlagIcon,
  ProfileIcon,
  TeamIcon,
} from "@/components/ahora/icons";
import { AhoraSectionTab } from "@/components/ahora/ui";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type AhoraLink = {
  href: string;
  label: string;
  icon: (p: { className?: string }) => React.ReactElement;
};

const SELF_LINKS: AhoraLink[] = [
  { href: "/employee", label: "Home", icon: HomeIcon },
  { href: "/employee/time-card", label: "Time Card", icon: CalendarIcon },
  { href: "/employee/payslips", label: "Payslips", icon: PayslipIcon },
  { href: "/employee/profile", label: "Profile", icon: ProfileIcon },
];

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

/** Section tab (HOME / TIME CARD / ...) derived from the current route. */
export function AhoraAutoSectionTab() {
  const pathname = usePathname();
  return <AhoraSectionTab>{ahoraSectionLabel(pathname)}</AhoraSectionTab>;
}

export function AhoraSidebar({ isManager }: { isManager: boolean }) {
  const pathname = usePathname();
  const links: AhoraLink[] = isManager
    ? [
        { href: "/manager/directory", label: "Team", icon: TeamIcon },
        ...SELF_LINKS,
      ]
    : SELF_LINKS;

  return (
    <nav
      aria-label="Employee sections"
      className="flex w-[76px] shrink-0 flex-col items-center gap-2 bg-[var(--ahora-chrome)] py-4 print:hidden sm:w-[88px]"
    >
      {links.map((link) => {
        const active =
          pathname === link.href || pathname.startsWith(link.href + "/");
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            title={link.label}
            aria-current={active ? "page" : undefined}
            className="group flex flex-col items-center gap-1 py-2"
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

export function AhoraTopBar({ userName }: { userName: string }) {
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
