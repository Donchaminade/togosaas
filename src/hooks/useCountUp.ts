import { useEffect, useRef, useState } from 'react';

/** Vrai si l'utilisateur préfère réduire les animations. */
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Compteur animé (count-up) basé sur requestAnimationFrame.
 * Anime de 0 jusqu'à `target` avec un easing « ease-out-expo ».
 * Respecte `prefers-reduced-motion` : affiche directement la valeur finale.
 */
export function useCountUp(target: number, durationMs = 1200): number {
  const safeTarget = Number.isFinite(target) ? target : 0;
  const [value, setValue] = useState(() => (prefersReducedMotion() ? safeTarget : 0));
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (prefersReducedMotion() || safeTarget === 0) {
      setValue(safeTarget);
      return;
    }

    let startTime: number | null = null;

    const tick = (now: number) => {
      if (startTime === null) startTime = now;
      const t = Math.min((now - startTime) / durationMs, 1);
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setValue(Math.round(safeTarget * eased));
      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [safeTarget, durationMs]);

  return value;
}

/**
 * Renvoie `false` au premier rendu puis `true` après le montage (double rAF),
 * pour déclencher les transitions CSS d'apparition (barres, anneaux).
 * Reste `false` indéfiniment si `prefers-reduced-motion` n'est pas requis ;
 * dans ce cas on passe directement à l'état final côté composant.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setMounted(true);
      return;
    }
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = requestAnimationFrame(() => setMounted(true));
    });
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return mounted;
}
