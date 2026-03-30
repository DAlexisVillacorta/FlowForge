"use client";

import { useEffect, useRef, useState } from "react";

interface CountUpOptions {
  target: number;
  duration?: number; // ms, default 1200
  delay?: number;    // ms before starting, default 0
  decimals?: number; // decimal places
}

/**
 * Animates a number from 0 to `target` over `duration` ms.
 * Returns the current animated value.
 */
export function useCountUp({
  target,
  duration = 1200,
  delay = 0,
  decimals = 0,
}: CountUpOptions): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (target === 0) return;

    const startAnimation = () => {
      const animate = (timestamp: number) => {
        if (!startTimeRef.current) startTimeRef.current = timestamp;
        const elapsed = timestamp - startTimeRef.current;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = eased * target;

        const factor = Math.pow(10, decimals);
        setValue(Math.round(current * factor) / factor);

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(animate);
        } else {
          setValue(target);
        }
      };
      rafRef.current = requestAnimationFrame(animate);
    };

    const timer = delay > 0 ? setTimeout(startAnimation, delay) : null;
    if (!timer) startAnimation();

    return () => {
      if (timer) clearTimeout(timer);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      startTimeRef.current = null;
    };
  }, [target, duration, delay, decimals]);

  return value;
}
