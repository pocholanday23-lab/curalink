import { CuralinkLogo } from "@/components/curalink-logo";

/**
 * Large, faint Curalink logo fixed behind every page. Sits above the page
 * background but behind all content (cards are opaque and cover it). Never
 * prints and never intercepts clicks.
 */
export function LogoWatermark() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 flex items-center justify-center overflow-hidden print:hidden"
    >
      <CuralinkLogo
        cColor="#ffffff"
        className="h-[110vmin] w-[110vmin] max-w-none text-white opacity-20"
      />
    </div>
  );
}
