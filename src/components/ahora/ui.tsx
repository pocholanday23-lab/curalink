import type {
  HTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/** Pale-mint card used throughout the employee "Ahora" dashboard look. */
export function AhoraCard({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx(
        "rounded-2xl bg-[var(--ahora-mint)] p-5 text-neutral-900 sm:p-6",
        className
      )}
      {...props}
    />
  );
}

/** Dark green "folder tab" label naming the current section (HOME, TIME CARD, ...). */
export function AhoraSectionTab({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6 inline-block rounded-r-lg bg-[var(--ahora-chrome)] py-3 pl-4 pr-8 text-lg font-bold tracking-wide text-white shadow-sm sm:pl-6 sm:pr-10">
      {children}
    </div>
  );
}

export function AhoraTable({
  className,
  ...props
}: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto rounded-xl">
      <table
        className={cx("w-full border-collapse text-sm", className)}
        {...props}
      />
    </div>
  );
}

export function AhoraTh({
  className,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cx(
        "bg-[var(--ahora-chrome)] px-4 py-3 text-left text-sm font-semibold text-white first:rounded-tl-xl last:rounded-tr-xl",
        className
      )}
      {...props}
    />
  );
}

export function AhoraTd({
  className,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cx(
        "border-b border-dashed border-[var(--ahora-mint-line)] bg-[var(--ahora-mint)] px-4 py-3 align-top",
        className
      )}
      {...props}
    />
  );
}

/** Decorative stat "gauge" — a partial ring with a big number centered inside. */
export function AhoraStatRing({
  label,
  value,
  color,
  size = 128,
}: {
  label: string;
  value: number;
  color: string;
  size?: number;
}) {
  const stroke = size * 0.11;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  // Fixed ~78% sweep, gap at the bottom-right — this is a styled badge, not a
  // literal proportional gauge (there's no single meaningful "max" shared by
  // workdays/absences/rest days/present).
  const sweep = 0.78;
  const dash = `${circumference * sweep} ${circumference * (1 - sweep)}`;

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-base font-medium text-neutral-800">{label}</span>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeOpacity={0.25}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={dash}
          transform={`rotate(-215 ${size / 2} ${size / 2})`}
        />
        <text
          x="50%"
          y="52%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-neutral-900 text-3xl font-bold"
          style={{ fontSize: size * 0.28 }}
        >
          {value}
        </text>
      </svg>
    </div>
  );
}
