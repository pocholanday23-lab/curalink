/**
 * Curalink wordmark: a bold blue "C" arc with "uralink" set inside it.
 * The "C" keeps the brand blue; the text uses `currentColor` so it adapts
 * to light (documents) and dark (app chrome) backgrounds.
 */
export function CuralinkLogo({
  className,
  cColor = "#1f52ad",
}: {
  className?: string;
  cColor?: string;
}) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      role="img"
      aria-label="Curalink"
    >
      <path
        d="M88.3 31.7 A40 40 0 1 0 88.3 88.3"
        fill="none"
        stroke={cColor}
        strokeWidth="22"
        strokeLinecap="round"
      />
      <text
        x="79"
        y="69"
        textAnchor="middle"
        fontSize="14"
        letterSpacing="2.5"
        fill="currentColor"
        fontFamily="Arial, Helvetica, sans-serif"
      >
        uralink
      </text>
    </svg>
  );
}
