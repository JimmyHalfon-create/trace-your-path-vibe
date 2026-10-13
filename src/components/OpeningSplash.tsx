import { useEffect, useRef } from "react";
import { t } from "@/lib/i18n";

// Module-level flag: survives in-app navigation and background resume,
// resets only when the JS bundle reloads (cold launch).
let shown = false;
export const shouldShowSplash = () => !shown;

const SHIELD =
  "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z";

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
        <svg viewBox="0 0 24 24" className="h-16 w-16" fill="none">
          <path
            d={SHIELD}
            pathLength={1}
            className="splash-shield stroke-primary"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h1 className="splash-title mt-5 text-4xl font-bold tracking-widest text-primary">TRACE</h1>
      <p className="splash-tagline mt-3 text-center text-sm text-foreground/85">{t.tagline}</p>
    </div>
  );
};

export default OpeningSplash;
