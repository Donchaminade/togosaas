import { Link } from 'react-router-dom';
import { ExternalLink, MapPin } from 'lucide-react';
import CommunityCoverFrame from './community/CommunityCoverFrame';
import ShareCommunityButton from './ui/ShareCommunityButton';
import CommunityEngagementBar from './community/CommunityEngagementBar';
import CommunityBadges from './ui/CommunityBadges';
import PricingBadge from './ui/PricingBadge';
import { formatLocation } from '../lib/location';
import { communityPublicPath } from '../lib/communityUrl';
import { solutionAccessUrl } from '../lib/pricing';
import { externalUrl } from '../lib/externalUrl';
import type { Community } from '../types';

interface CommunityCardProps {
  community: Community;
}

export default function CommunityCard({ community }: CommunityCardProps) {
  if (!community.id) {
    return null;
  }

  const accessUrl = externalUrl(solutionAccessUrl(community));

  return (
    <div className="motion-hover-lift group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white text-left shadow-sm transition-all hover:border-togo-green/40 hover:shadow-xl hover:shadow-togo-green/10 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-togo-yellow/30 dark:hover:shadow-togo-yellow/5">
      <ShareCommunityButton
        community={community}
        variant="icon"
        className="absolute right-3 top-3 z-10 rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100 focus:opacity-100 dark:bg-slate-900/90 sm:opacity-100"
      />

      <div className="absolute left-3 top-3 z-10">
        <PricingBadge
          pricingType={community.pricingType}
          priceAmount={community.priceAmount}
          currency={community.currency}
          billingPeriod={community.billingPeriod}
        />
      </div>

      <Link to={communityPublicPath(community)} className="flex h-full flex-col">
        <CommunityCoverFrame
          bannerUrl={community.bannerUrl}
          logoUrl={community.logoUrl}
          name={community.name}
        />

        <div className="flex flex-1 flex-col p-5">
          <h3 className="line-clamp-2 text-base font-bold leading-snug text-slate-900 dark:text-white">
            {community.name}
          </h3>
          <CommunityBadges community={community} className="mt-2" />
          <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-togo-red" />
            {formatLocation(community)}
          </p>

          <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {community.description}
          </p>

          <div className="mt-3" onClick={(e) => e.stopPropagation()}>
            <CommunityEngagementBar
              community={community}
              compact
              initial={{
                likesCount: community.likesCount,
                ratingAvg: community.ratingAvg,
                reviewsCount: community.reviewsCount,
              }}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {community.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                {tag}
              </span>
            ))}
            {community.tags.length > 4 && (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-400 dark:bg-slate-800">
                +{community.tags.length - 4}
              </span>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <span className="line-clamp-1 text-xs font-medium text-slate-500 dark:text-slate-400">
              Par {community.leaderName}
            </span>
            {accessUrl && (
              <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-togo-green dark:text-togo-yellow">
                Accéder <ExternalLink className="h-3 w-3" />
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
