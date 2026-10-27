import { useEffect, useRef } from "react";
import { t } from "@/lib/i18n";

// Module-level flag: survives in-app navigation and background resume,
// resets only when the JS bundle reloads (cold launch).
let shown = false;
export const shouldShowSplash = () => !shown;

// New TraceOn mark: open ring with a dot nestled in the opening.
const RING = "M 81.9 43.4 A 34 34 0 1 1 55.9 21.5";

const OpeningSplash = ({ onDone }: { onDone: () => void }) => {
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    shown = true;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = setTimeout(() => done.current(), reduced ? 1800 : 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="splash fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background px-6"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-hidden="true"
    >
      <div className="relative flex h-20 w-20 items-center justify-center">
        <span className="splash-wave absolute inset-0 rounded-full border border-primary" />
        <svg viewBox="0 0 100 100" className="h-16 w-16" fill="none">
          <path
            d={RING}
            pathLength={1}
            className="splash-shield stroke-primary"
            strokeWidth={14}
          />
          <circle
            cx={74.2}
            cy={24.7}
            r={11.2}
            className="splash-dot fill-primary"
          />
        </svg>
      </div>
      <h1 className="splash-title mt-5 text-4xl font-bold tracking-widest text-primary">TraceOn</h1>
      <p className="splash-tagline mt-3 text-center text-sm text-foreground/85">{t.tagline}</p>
    </div>
  );
};

export default OpeningSplash;
