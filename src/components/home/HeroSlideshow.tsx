import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Rocket, Search, Shield, Sparkles } from 'lucide-react';
import { HERO_SLIDES } from '../../data/heroSlides';

/** Durée d'affichage par image avant la transition suivante */
const SLIDE_MS = 6000;
/** Fondu enchaîné entre deux images (style diaporama PC) */
const FADE_MS = 2200;

interface HeroSlideshowProps {
  stats: { communities: number; cities: number; tags: number };
}

export default function HeroSlideshow({ stats }: HeroSlideshowProps) {
  const [active, setActive] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [introDone, setIntroDone] = useState(false);
  const count = HERO_SLIDES.length;
  const timerRef = useRef<number | null>(null);
  const fadeTimerRef = useRef<number | null>(null);

  const goTo = useCallback(
    (index: number) => {
      setActive((current) => {
        const next = (index + count) % count;
        if (next === current) return current;
        setPrev(current);
        return next;
      });
    },
    [count],
  );

  const goPrev = useCallback(() => goTo(active - 1), [active, goTo]);
  const goNext = useCallback(() => goTo(active + 1), [active, goTo]);

  /* Précharge toutes les images pour un diaporama fluide */
  useEffect(() => {
    HERO_SLIDES.forEach(({ src }) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  /* Première image visible immédiatement (sans fondu au chargement) */
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => setIntroDone(true));
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  /* Défilement automatique — rythme diaporama PC */
  const restartAutoplay = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
    }
    if (count <= 1) return;

    timerRef.current = window.setInterval(() => {
      setActive((current) => {
        const next = (current + 1) % count;
        setPrev(current);
        return next;
      });
    }, SLIDE_MS);
  }, [count]);

  useEffect(() => {
    restartAutoplay();
    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
      }
      if (fadeTimerRef.current !== null) {
        window.clearTimeout(fadeTimerRef.current);
      }
    };
  }, [restartAutoplay]);

  /* Nettoie la slide sortante après le fondu */
  useEffect(() => {
    if (prev === null) return;
    if (fadeTimerRef.current !== null) {
      window.clearTimeout(fadeTimerRef.current);
    }
    fadeTimerRef.current = window.setTimeout(() => setPrev(null), FADE_MS + 120);
    return () => {
      if (fadeTimerRef.current !== null) {
        window.clearTimeout(fadeTimerRef.current);
      }
    };
  }, [prev, active]);

  const handleManualNav = useCallback(
    (action: () => void) => {
      action();
      restartAutoplay();
    },
    [restartAutoplay],
  );

  return (
    <section
      className="relative min-h-[100svh] w-full overflow-hidden"
      style={
        {
          '--hero-slide-hold': `${SLIDE_MS}ms`,
          '--hero-slide-fade': `${FADE_MS}ms`,
        } as CSSProperties
      }
    >
      {/* Diaporama — fondu enchaîné + zoom lent continu (style lecteur PC) */}
      {HERO_SLIDES.map((slide, i) => {
        const isActive = i === active;
        const isLeaving = prev !== null && i === prev && !isActive;
        const isPlaying = isActive || isLeaving;

        return (
          <div
            key={slide.src}
            className={`hero-slide-layer absolute inset-0 ${
              isActive ? 'hero-slide-layer--active' : ''
            } ${isLeaving ? 'hero-slide-layer--leaving' : ''} ${
              isPlaying ? 'hero-slide-layer--playing' : ''
            } ${isActive && !introDone ? 'hero-slide-layer--instant' : ''}`}
            aria-hidden={!isActive}
          >
            <div className="hero-slide-media absolute inset-0">
              <img
                src={slide.src}
                alt={isActive ? slide.alt : ''}
                className="hero-slide-img hero-slide-img--dark h-full w-full object-cover"
                loading="eager"
                decoding="async"
                fetchPriority={i === 0 ? 'high' : 'low'}
              />
              <div className="hero-slide-overlay absolute inset-0" />
            </div>
          </div>
        );
      })}

      {/* Contenu */}
      <div className="absolute inset-0 z-20 flex flex-col px-4 pb-5 pt-[5.25rem] sm:px-6 sm:pb-8 sm:pt-[6.75rem] md:pt-[7.25rem] lg:pt-[7.75rem]">
        <div className="mx-auto flex w-full max-w-5xl min-h-0 flex-1 flex-col items-center justify-center text-center">
          <p className="animate-rise mb-3 inline-flex max-w-[95vw] items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.1em] text-white/90 shadow-md backdrop-blur-md sm:mb-4 sm:gap-1.5 sm:px-3 sm:py-1 sm:text-[9px] sm:tracking-[0.14em]">
            <Sparkles className="h-3 w-3 shrink-0 text-togo-yellow sm:h-3.5 sm:w-3.5" />
            <span className="leading-tight">Le hub des communautés togolaises</span>
          </p>

          <h1 className="animate-rise delay-100 text-[2.25rem] font-black leading-[1.12] tracking-tight text-white drop-shadow-lg sm:text-[2.75rem] sm:leading-[1.08] md:text-[3.25rem] lg:text-[3.75rem] xl:text-[4rem]">
            Trouvez, rejoignez et faites briller les{' '}
            <span className="bg-gradient-to-r from-togo-green via-togo-yellow to-togo-red bg-clip-text text-transparent">
              communautés
            </span>{' '}
            du Togo
          </h1>

          <p className="animate-rise delay-200 mt-3 max-w-[20rem] text-sm leading-relaxed text-white/80 sm:mt-5 sm:max-w-xl sm:text-[15px] md:max-w-2xl md:text-base">
            Fini la chasse au contact : parcourez l&apos;annuaire, découvrez les groupes près de
            chez vous et échangez directement avec leurs responsables.
          </p>

          <div className="animate-rise delay-300 mt-5 flex w-full max-w-md flex-col gap-2.5 sm:mt-8 sm:max-w-xl sm:flex-row sm:justify-center sm:gap-3">
            <Link
              to="/inscription"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-togo-green px-5 py-3 text-xs font-bold uppercase tracking-wide text-white shadow-xl shadow-togo-green/35 transition-all hover:bg-togo-green-light active:scale-[0.98] sm:w-auto sm:px-7 sm:py-3.5 sm:text-sm"
            >
              Exposer ma communauté
              <Rocket className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-y-0.5 sm:h-[18px] sm:w-[18px]" />
            </Link>
            <Link
              to="/communautes"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-3 text-xs font-bold uppercase tracking-wide text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-[0.98] sm:w-auto sm:px-7 sm:py-3.5 sm:text-sm"
            >
              Voir l&apos;annuaire
              <Search className="h-4 w-4 shrink-0 sm:h-[18px] sm:w-[18px]" />
            </Link>
          </div>

          <Link
            to="/signaler"
            className="animate-rise delay-400 mt-3 inline-flex w-full max-w-md items-center justify-center gap-2 rounded-full border border-rose-400/40 bg-rose-500/15 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wide text-rose-100 backdrop-blur-md transition-all hover:border-rose-300/60 hover:bg-rose-500/25 active:scale-[0.98] sm:mt-5 sm:w-auto sm:max-w-none sm:px-6 sm:py-3 sm:text-[11px]"
          >
            <Shield className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
            Signaler un abus
            <span className="hidden font-semibold normal-case sm:inline">(anonyme)</span>
          </Link>
        </div>

        {/* Stats + diaporama — en bas, sans chevauchement */}
        <div className="mx-auto mt-4 w-full max-w-xl shrink-0 space-y-3 sm:mt-6 sm:max-w-2xl sm:space-y-4">
          <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
            {[
              { value: stats.communities > 0 ? String(stats.communities) : '—', label: 'Communautés', short: 'Comm.' },
              { value: stats.cities > 0 ? String(stats.cities) : '—', label: 'Villes', short: 'Villes' },
              { value: stats.tags > 0 ? String(stats.tags) : '—', label: 'Thématiques', short: 'Thèmes' },
            ].map((s) => (
              <div
                key={s.label}
                className="relative rounded-xl border border-white/15 bg-black/30 px-2 py-3 text-center backdrop-blur-md sm:rounded-2xl sm:px-3 sm:py-3.5"
              >
                {s.label === 'Communautés' && stats.communities > 0 && (
                  <span className="absolute -right-1 -top-1 rounded-full bg-togo-yellow px-1.5 py-0.5 text-[7px] font-black uppercase text-slate-900 shadow sm:text-[7px]">
                    Live
                  </span>
                )}
                <p className="text-lg font-black text-white sm:text-xl md:text-2xl">{s.value}</p>
                <p className="mt-0.5 text-[8px] font-semibold uppercase tracking-wide text-white/60 sm:text-[9px]">
                  <span className="sm:hidden">{s.short}</span>
                  <span className="hidden sm:inline">{s.label}</span>
                </p>
              </div>
            ))}
          </div>

          {/* Indicateurs diaporama — intégrés au flux sur mobile */}
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => handleManualNav(goPrev)}
              aria-label="Image précédente"
              className="hidden rounded-full border border-white/20 bg-black/30 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/15 sm:inline-flex sm:p-2.5"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex max-w-[70vw] items-center justify-center gap-1 overflow-x-auto sm:max-w-none sm:gap-1.5">
              {HERO_SLIDES.map((slide, i) => (
                <button
                  key={slide.src}
                  type="button"
                  onClick={() => handleManualNav(() => goTo(i))}
                  aria-label={`Image ${i + 1}`}
                  aria-current={i === active ? 'true' : undefined}
                  className={`hero-slide-dot h-1 shrink-0 rounded-full sm:h-1 ${
                    i === active
                      ? 'hero-slide-dot--active w-5 bg-togo-green sm:w-8'
                      : 'w-1.5 bg-white/30 transition-all duration-500 hover:bg-white/50 sm:w-3'
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => handleManualNav(goNext)}
              aria-label="Image suivante"
              className="hidden rounded-full border border-white/20 bg-black/30 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/15 sm:inline-flex sm:p-2.5"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[15] h-12 bg-gradient-to-t from-slate-950/50 to-transparent sm:h-20" />
    </section>
  );
}

export { HERO_SLIDES as SLIDES };
