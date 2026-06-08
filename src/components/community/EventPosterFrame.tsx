import { Calendar } from 'lucide-react';
import { mediaUrl } from '../../lib/media';

interface EventPosterFrameProps {
  posterUrl?: string | null;
  title: string;
  /** compact = cartes liste, hero = page détail */
  variant?: 'compact' | 'hero';
  className?: string;
}

/** Affiche événement entièrement visible, sans rognage. */
export default function EventPosterFrame({
  posterUrl,
  title,
  variant = 'compact',
  className = '',
}: EventPosterFrameProps) {
  const src = posterUrl ? mediaUrl(posterUrl) : null;
  const isHero = variant === 'hero';

  if (!src) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-sky-600 via-sky-700 to-slate-900 p-6 ${
          isHero ? 'min-h-[220px] sm:min-h-[280px]' : 'min-h-[160px]'
        } ${className}`}
      >
        <p className={`text-center font-black leading-tight text-white ${isHero ? 'text-xl sm:text-2xl' : 'text-base'}`}>
          {title}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center bg-slate-100 dark:bg-slate-800/90 ${
        isHero ? 'min-h-[240px] p-3 sm:min-h-[320px] sm:p-4' : 'min-h-[160px] p-2 sm:min-h-[180px]'
      } ${className}`}
    >
      <img
        src={src}
        alt={title}
        className={`w-full object-contain ${
          isHero ? 'max-h-[min(72vh,640px)]' : 'max-h-44 sm:max-h-48'
        }`}
        loading="lazy"
      />
    </div>
  );
}

export function EventPosterPlaceholder({ title, className = '' }: { title: string; className?: string }) {
  return (
    <div className={`flex min-h-[160px] flex-col items-center justify-center gap-2 bg-gradient-to-br from-sky-50 to-slate-100 p-4 dark:from-sky-950/40 dark:to-slate-900 ${className}`}>
      <Calendar className="h-8 w-8 text-sky-400" />
      <span className="line-clamp-2 text-center text-xs font-semibold text-slate-600 dark:text-slate-300">{title}</span>
    </div>
  );
}
