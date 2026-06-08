import { useCallback, useEffect, useState, type MouseEvent } from 'react';
import { Heart, Star } from 'lucide-react';
import { api } from '../../lib/api';
import { communityApiRef } from '../../lib/communityUrl';
import { getVisitorId } from '../../lib/visitor';
import type { Community, CommunityEngagement } from '../../types';

interface Props {
  community: Community;
  compact?: boolean;
  initial?: Partial<CommunityEngagement>;
  onChange?: (engagement: CommunityEngagement) => void;
}

export default function CommunityEngagementBar({
  community,
  compact = false,
  initial,
  onChange,
}: Props) {
  const [engagement, setEngagement] = useState<CommunityEngagement>({
    likesCount: initial?.likesCount ?? community.likesCount ?? 0,
    ratingAvg: initial?.ratingAvg ?? community.ratingAvg ?? null,
    reviewsCount: initial?.reviewsCount ?? community.reviewsCount ?? 0,
    liked: initial?.liked ?? false,
    userRating: initial?.userRating ?? null,
  });
  const [hoverRating, setHoverRating] = useState(0);
  const [busy, setBusy] = useState<'like' | 'review' | null>(null);

  const apply = useCallback(
    (next: CommunityEngagement) => {
      setEngagement(next);
      onChange?.(next);
    },
    [onChange],
  );

  useEffect(() => {
    const ref = communityApiRef(community);
    const visitorId = getVisitorId();
    api
      .getCommunityEngagement(ref, visitorId)
      .then((res) => apply(res.data.engagement))
      .catch(() => {
        /* stats initiales depuis la liste / fiche */
      });
  }, [community, apply]);

  const stopNav = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleLike = async (e: MouseEvent) => {
    stopNav(e);
    if (busy) return;
    setBusy('like');
    try {
      const res = await api.toggleCommunityLike(communityApiRef(community), getVisitorId());
      apply({ ...engagement, ...res.data.engagement });
    } finally {
      setBusy(null);
    }
  };

  const handleRate = async (rating: number, e: MouseEvent) => {
    stopNav(e);
    if (busy) return;
    setBusy('review');
    try {
      const res = await api.rateCommunity(communityApiRef(community), getVisitorId(), rating);
      apply({ ...engagement, ...res.data.engagement });
    } finally {
      setBusy(null);
    }
  };

  const ratingLabel =
    engagement.ratingAvg != null && engagement.ratingAvg > 0
      ? engagement.ratingAvg.toFixed(1)
      : '—';
  const displayRating = hoverRating || engagement.userRating || 0;

  return (
    <div
      className={`flex flex-wrap items-center gap-3 text-slate-500 dark:text-slate-400 ${
        compact ? 'text-xs' : 'text-sm'
      }`}
    >
      <button
        type="button"
        onClick={handleLike}
        disabled={busy === 'like'}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors ${
          engagement.liked
            ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
            : 'bg-slate-100 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-500/10 dark:hover:text-rose-400'
        }`}
        aria-pressed={engagement.liked}
        aria-label={engagement.liked ? 'Retirer le like' : 'Aimer cette communauté'}
      >
        <Heart
          className={`h-3.5 w-3.5 ${engagement.liked ? 'fill-rose-500 text-rose-500' : ''}`}
        />
        <span className="font-semibold">{engagement.likesCount.toLocaleString('fr-FR')}</span>
        {!compact && <span className="hidden sm:inline">J&apos;aime</span>}
      </button>

      <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 dark:bg-slate-800">
        <div
          className="flex items-center gap-0.5"
          onMouseLeave={() => setHoverRating(0)}
          role="group"
          aria-label="Noter la communauté de 1 à 5 étoiles"
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              disabled={busy === 'review'}
              onMouseEnter={() => setHoverRating(star)}
              onClick={(e) => handleRate(star, e)}
              className="rounded p-0.5 transition-transform hover:scale-110 disabled:opacity-60"
              aria-label={`${star} étoile${star > 1 ? 's' : ''}`}
            >
              <Star
                className={`h-3.5 w-3.5 ${
                  star <= displayRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'
                }`}
              />
            </button>
          ))}
        </div>
        <span className="font-semibold">{ratingLabel}</span>
        {!compact && (
          <span className="hidden sm:inline">
            {engagement.reviewsCount > 0
              ? `(${engagement.reviewsCount} avis)`
              : '(avis)'}
          </span>
        )}
      </div>
    </div>
  );
}
