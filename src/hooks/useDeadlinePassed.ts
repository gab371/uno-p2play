import { useEffect, useState } from "react";

/** True once `untilMs` is null or the clock has passed it (re-renders on expiry). */
export function useDeadlinePassed(untilMs: number | null | undefined): boolean {
  const [passed, setPassed] = useState(
    () => untilMs == null || Date.now() >= untilMs,
  );

  useEffect(() => {
    if (untilMs == null) {
      setPassed(true);
      return;
    }
    const remaining = untilMs - Date.now();
    if (remaining <= 0) {
      setPassed(true);
      return;
    }
    setPassed(false);
    const id = window.setTimeout(() => setPassed(true), remaining);
    return () => window.clearTimeout(id);
  }, [untilMs]);

  return passed;
}
