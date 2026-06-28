import { Sparkles, Star } from 'lucide-react';
import { BADGE_TONE_CLASSES, communityBadges } from '../../lib/badges';
import type { Community } from '../../types';

interface Props {
  community: Community;
  className?: string;
}

const ICON = {
  'top-rated': Star,
  new: Sparkles,
} as const;

/** Badges de confiance (« Top noté », « Nouveau ») calculés sans base de données. */
export default function CommunityBadges({ community, className = '' }: Props) {
  const badges = communityBadges(community);
  if (badges.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {badges.map((badge) => {
        const Icon = ICON[badge.key];
        return (
          <span
            key={badge.key}
            title={badge.title}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${BADGE_TONE_CLASSES[badge.tone]}`}
          >
            <Icon className="h-3 w-3" />
            {badge.label}
          </span>
        );
      })}
    </div>
  );
}
