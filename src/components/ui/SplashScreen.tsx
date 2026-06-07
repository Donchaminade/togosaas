import { useEffect, useState } from 'react';
import Logo from './Logo';

const SPLASH_KEY = 'tch_splash_seen';
const MIN_DURATION_MS = 2600;
const FADE_OUT_MS = 700;

interface Props {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: Props) {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter');

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const holdMs = reduced ? 400 : MIN_DURATION_MS;
    const fadeMs = reduced ? 150 : FADE_OUT_MS;

    const holdTimer = window.setTimeout(() => setPhase('exit'), holdMs);
    const exitTimer = window.setTimeout(() => {
      sessionStorage.setItem(SPLASH_KEY, '1');
      onComplete();
    }, holdMs + fadeMs);

    return () => {
      window.clearTimeout(holdTimer);
      window.clearTimeout(exitTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`splash-screen fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black ${
        phase === 'exit' ? 'splash-screen--exit' : 'splash-screen--enter'
      }`}
      aria-hidden={phase === 'exit'}
      role="presentation"
    >
      <div className="splash-glow pointer-events-none absolute left-1/2 top-[38%] h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(210,16,52,0.45)_0%,rgba(210,16,52,0.12)_40%,transparent_70%)] blur-2xl sm:h-80 sm:w-80" />

      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <div className="splash-logo mb-10 flex flex-col items-center">
          <Logo variant="splash" linked={false} className="pointer-events-none drop-shadow-2xl" />
        </div>

        <h1 className="splash-title text-3xl font-black uppercase leading-none tracking-tight sm:text-5xl md:text-6xl">
          <span className="text-white">Togo </span>
          <span className="text-togo-red">Communities Hub</span>
        </h1>

        <div className="splash-subtitle mt-8 flex items-center gap-4">
          <span className="h-px w-10 bg-white/25 sm:w-14" aria-hidden />
          <p className="text-[10px] font-semibold uppercase tracking-[0.45em] text-white/70 sm:text-xs">
            L&apos;aventure commence
          </p>
          <span className="h-px w-10 bg-white/25 sm:w-14" aria-hidden />
        </div>
      </div>

      <div className="splash-footer absolute bottom-10 left-1/2 h-0.5 w-16 -translate-x-1/2 rounded-full bg-togo-red sm:bottom-12 sm:w-20" />
    </div>
  );
}

export function shouldShowSplash(): boolean {
  try {
    return !sessionStorage.getItem(SPLASH_KEY);
  } catch {
    return true;
  }
}
