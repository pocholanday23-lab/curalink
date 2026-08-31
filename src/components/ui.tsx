import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  SelectHTMLAttributes,
  TdHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "rounded-lg border border-black/10 bg-[var(--green-khaki)] p-6 text-neutral-900 shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-sm opacity-70">{description}</p>
        )}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

const buttonVariants = {
  primary:
    "bg-black text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80",
  secondary:
    "border border-black/15 bg-white text-neutral-900 hover:bg-black/5 dark:border-white/20 dark:bg-transparent dark:text-white dark:hover:bg-white/10",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof buttonVariants;
}) {
  return (
    <button
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        buttonVariants[variant],
        className
      )}
      {...props}
    />
  );
}

export function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function Label(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className="text-sm font-medium text-black/80 dark:text-white/80"
      {...props}
    />
  );
}

const inputClass =
  "w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-black/40 disabled:opacity-50 dark:border-white/20 dark:bg-black/20 dark:text-white dark:focus:border-white/40";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={inputClass} {...props} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={inputClass} {...props} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={inputClass} {...props} />;
}

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/10">
      <table className="w-full min-w-full divide-y divide-black/10 text-sm dark:divide-white/10">
        {children}
      </table>
    </div>
  );
}

export function Th({ children }: { children?: React.ReactNode }) {
  return (
    <th className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
  ...rest
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cx("whitespace-nowrap px-4 py-2.5 align-middle", className)}
      {...rest}
    >
      {children}
    </td>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "green" | "amber" | "red";
}) {
  const tones = {
    neutral: "bg-black/5 text-black/70 dark:bg-white/10 dark:text-white/70",
    green:
      "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
    amber:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    red: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  };
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}

export function ErrorText({ children }: { children?: string }) {
  if (!children) return null;
  return (
    <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
      {children}
    </p>
  );
}
