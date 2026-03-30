"use client";

import { useState, useEffect } from "react";

/**
 * Simulates an 800ms page load delay.
 * Returns `true` while loading, `false` when done.
 */
export function usePageLoader(ms = 800): boolean {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), ms);
    return () => clearTimeout(timer);
    // ms is a stable number, intentionally omitted from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return loading;
}
