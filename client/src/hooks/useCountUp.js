import { useState, useEffect, useRef } from 'react';

export function useCountUp(target = 0, duration = 900, enabled = true) {
  const numericTarget = typeof target === 'number' && !Number.isNaN(target) ? Math.round(target) : 0;
  const [value, setValue] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!enabled) {
      setValue(0);
      return;
    }

    if (
      typeof window === 'undefined' ||
      (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    ) {
      setValue(numericTarget);
      return;
    }

    let startTime = null;
    const startValue = 0;

    function tick(now) {
      if (!startTime) startTime = now;
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Smooth cubic ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (numericTarget - startValue) * eased);
      setValue(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setValue(numericTarget);
      }
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [numericTarget, duration, enabled]);

  return value;
}
