import { useEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';

export type RevealVariant =
  | 'fade-up'
  | 'fade-down'
  | 'fade-in'
  | 'zoom-in'
  | 'zoom-out'
  | 'slide-left'
  | 'slide-right'
  | 'blur-in'
  | 'gentle-up'
  | 'gentle-in';

const VARIANT_CLASS: Record<RevealVariant, string> = {
  'fade-up': 'motion-fade-up',
  'fade-down': 'motion-fade-down',
  'fade-in': 'motion-fade-in',
  'zoom-in': 'motion-zoom-in',
  'zoom-out': 'motion-zoom-out',
  'slide-left': 'motion-slide-left',
  'slide-right': 'motion-slide-right',
  'blur-in': 'motion-blur-in',
  'gentle-up': 'motion-gentle-up',
  'gentle-in': 'motion-gentle-in',
};

interface ScrollRevealProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: RevealVariant;
  /** Délai en ms avant le début de l'animation */
  delay?: number;
  /** Durée en ms */
  duration?: number;
  /** Ne jouer l'animation qu'une seule fois (défaut: true) */
  once?: boolean;
  /** Seuil de visibilité 0–1 */
  threshold?: number;
}

export default function ScrollReveal({
  children,
  variant = 'gentle-up',
  delay = 0,
  duration = 1050,
  className = '',
  once = true,
  threshold = 0.04,
  style,
  ...rest
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let cancelled = false;
    let observer: IntersectionObserver | null = null;

    // Laisse le navigateur peindre l'état initial (opacity: 0) avant d'observer
    const mountFrame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (cancelled) return;

        observer = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              requestAnimationFrame(() => {
                if (!cancelled) setVisible(true);
              });
              if (once) observer?.unobserve(el);
            } else if (!once) {
              setVisible(false);
            }
          },
          { threshold, rootMargin: '0px 0px -2% 0px' },
        );

        observer.observe(el);
      });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(mountFrame);
      observer?.disconnect();
    };
  }, [once, threshold]);

  return (
    <div
      ref={ref}
      className={`motion-reveal min-w-0 max-w-full ${VARIANT_CLASS[variant]} ${visible ? 'motion-visible' : ''} ${className}`}
      style={
        {
          '--motion-delay': `${delay}ms`,
          '--motion-duration': `${duration}ms`,
          ...style,
        } as CSSProperties
      }
      {...rest}
    >
      {children}
    </div>
  );
}

/** ScrollReveal avec délai calculé selon l'index (listes, grilles). */
export function StaggerReveal({
  index,
  stagger = 95,
  maxDelay = 480,
  delay,
  duration = 1100,
  variant = 'gentle-up',
  ...props
}: ScrollRevealProps & { index: number; stagger?: number; maxDelay?: number }) {
  const computedDelay = delay ?? Math.min(index * stagger, maxDelay);
  return <ScrollReveal {...props} delay={computedDelay} />;
}

/** Animation d'entrée instantanée (changement de page, montage) */
export function MotionIn({
  children,
  variant = 'zoom-in',
  className = '',
  delay = 0,
  duration = 550,
  keyProp,
}: {
  children: ReactNode;
  variant?: RevealVariant;
  className?: string;
  delay?: number;
  duration?: number;
  keyProp?: string | number;
}) {
  return (
    <div
      key={keyProp}
      className={`motion-enter ${VARIANT_CLASS[variant]} motion-enter-active ${className}`}
      style={
        {
          '--motion-delay': `${delay}ms`,
          '--motion-duration': `${duration}ms`,
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}
