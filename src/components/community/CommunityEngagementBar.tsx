import { Heart, Star } from 'lucide-react';

/** Bandeau likes / avis — données réelles à brancher plus tard. */
export default function CommunityEngagementBar({
  likes = 0,
  rating = null,
  reviewsCount = 0,
  compact = false,
}: {
  likes?: number;
  rating?: number | null;
  reviewsCount?: number;
  compact?: boolean;
}) {
  const ratingLabel = rating != null && rating > 0 ? rating.toFixed(1) : '—';

  return (
    <div
      className={`inline-flex items-center gap-3 text-slate-500 dark:text-slate-400 ${
        compact ? 'text-xs' : 'text-sm'
      }`}
    >
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 dark:bg-slate-800">
        <Heart className={`h-3.5 w-3.5 ${likes > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
        <span className="font-semibold">{likes.toLocaleString('fr-FR')}</span>
        {!compact && <span className="hidden sm:inline">J&apos;aime</span>}
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 dark:bg-slate-800">
        <Star className={`h-3.5 w-3.5 ${rating != null && rating > 0 ? 'fill-amber-400 text-amber-400' : ''}`} />
        <span className="font-semibold">{ratingLabel}</span>
        {!compact && (
          <span className="hidden sm:inline">
            {reviewsCount > 0 ? `(${reviewsCount} avis)` : '(avis)'}
          </span>
        )}
      </span>
    </div>
  );
}
