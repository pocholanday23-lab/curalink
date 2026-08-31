"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/lib/actions/auth";
import { CuralinkLogo } from "@/components/curalink-logo";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const THEMES = {
  default: {
    header:
      "border-b border-black/10 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-black/40",
    brandChip: "text-neutral-800 dark:text-white",
    toggle:
      "rounded-md border border-black/15 px-2 py-1 text-sm dark:border-white/20",
    active: "bg-black text-white dark:bg-white dark:text-black",
    inactive:
      "text-black/70 hover:bg-black/5 dark:text-white/70 dark:hover:bg-white/10",
    meta: "text-black/60 dark:text-white/60",
    divider: "border-black/10 dark:border-white/10",
    signOut:
      "rounded-md border border-black/15 px-3 py-1.5 font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10",
  },
  green: {
    header:
      "border-b border-white/15 bg-[var(--green-hunter-deep)] text-white",
    brandChip:
      "rounded-md bg-white px-2 py-1 text-neutral-800 shadow-sm ring-1 ring-black/5",
    toggle: "rounded-md border border-white/25 px-2 py-1 text-sm text-white",
    active: "bg-white/20 text-white",
    inactive: "text-white/75 hover:bg-white/10 hover:text-white",
    meta: "text-white/70",
    divider: "border-white/15",
    signOut:
      "rounded-md border border-white/25 px-3 py-1.5 font-medium text-white hover:bg-white/10",
  },
} as const;

export function NavBar({
  links,
  userName,
  roleLabel,
  theme = "default",
}: {
  links: { href: string; label: string }[];
  userName: string;
  roleLabel: string;
  theme?: keyof typeof THEMES;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const t = THEMES[theme];

  return (
    <header className={cx("print:hidden", t.header)}>
      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <span className={cx("inline-flex items-center", t.brandChip)}>
            <CuralinkLogo className="h-7 w-7" />
          </span>
          <div className="flex items-center gap-3 text-sm">
            <span className={cx("hidden sm:inline", t.meta)}>
              {userName} · {roleLabel}
            </span>
            <form action={signOutAction} className="hidden sm:block">
              <button type="submit" className={t.signOut}>
                Sign out
              </button>
            </form>
            <button
              type="button"
              aria-label="Toggle menu"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className={cx("sm:hidden", t.toggle)}
            >
              {open ? "✕" : "☰"}
            </button>
          </div>
        </div>

        <nav
          className={cx(
            "mt-3 flex-col gap-1 sm:mt-2 sm:flex sm:flex-row sm:flex-wrap sm:items-center",
            open ? "flex" : "hidden"
          )}
        >
          {links.map((link) => {
            const active =
              pathname === link.href ||
              pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cx(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active ? t.active : t.inactive
                )}
              >
                {link.label}
              </Link>
            );
          })}

          <div
            className={cx(
              "mt-2 flex items-center justify-between border-t pt-2 text-sm sm:hidden",
              t.divider
            )}
          >
            <span className={t.meta}>
              {userName} · {roleLabel}
            </span>
            <form action={signOutAction}>
              <button type="submit" className={t.signOut}>
                Sign out
              </button>
            </form>
          </div>
        </nav>
      </div>
    </header>
  );
}
