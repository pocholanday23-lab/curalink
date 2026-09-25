/** Small inline icon set for the employee "Ahora" dashboard sidebar/top bar. */

type IconProps = { className?: string };

export function HomeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 11.5 12 4l8 7.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 10v9a1 1 0 0 0 1 1h3v-5a2 2 0 0 1 4 0v5h3a1 1 0 0 0 1-1v-9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect
        x="4"
        y="5.5"
        width="16"
        height="14.5"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M4 9.5h16" stroke="currentColor" strokeWidth="2" />
      <path d="M8 3.5v3M16 3.5v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M7.5 13h2v2h-2zM11 13h2v2h-2zM14.5 13h2v2h-2zM7.5 16.5h2v2h-2zM11 16.5h2v2h-2z"
        fill="currentColor"
      />
    </svg>
  );
}

export function PayslipIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M8 9h5M8 12.2h8M8 15.4h8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="16.2" cy="8.2" r="0.6" fill="currentColor" />
    </svg>
  );
}

export function ProfileIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M5 20c0-3.6 3.13-6 7-6s7 2.4 7 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function TeamIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="9" cy="8" r="2.6" stroke="currentColor" strokeWidth="2" />
      <path
        d="M3.5 19c0-2.9 2.46-4.8 5.5-4.8s5.5 1.9 5.5 4.8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M15.3 6.2a2.6 2.6 0 1 1 0 5.2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M15.6 14.3c2.36.35 4.1 1.95 4.1 4.7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Simplified Philippine flag, decorative only. */
export function PhFlagIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 24" className={className} aria-hidden="true">
      <rect width="32" height="24" fill="#0038a8" />
      <rect width="32" height="12" y="12" fill="#ce1126" />
      <path d="M0 0 L14 12 L0 24 Z" fill="#ffffff" />
      <circle cx="4.5" cy="12" r="1.8" fill="#fcd116" />
      <circle cx="2.2" cy="3.5" r="0.9" fill="#fcd116" />
      <circle cx="2.2" cy="20.5" r="0.9" fill="#fcd116" />
      <circle cx="11.5" cy="12" r="0.9" fill="#fcd116" />
    </svg>
  );
}
