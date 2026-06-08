import { Link } from 'react-router-dom';
import { MapPin, Users } from 'lucide-react';
import ShareCommunityButton from './ui/ShareCommunityButton';
import CommunityEngagementBar from './community/CommunityEngagementBar';
import { formatLocation } from '../lib/location';
import { communityPublicPath } from '../lib/communityUrl';
import { mediaUrl } from '../lib/media';
import type { Community } from '../types';

interface CommunityCardProps {
  community: Community;
}

export default function CommunityCard({ community }: CommunityCardProps) {
  if (!community.id) {
    return null;
  }

  return (
    <div className="motion-hover-lift group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white text-left dark:border-slate-800 dark:bg-slate-900 dark:hover:border-togo-yellow/30 hover:border-togo-green/40 hover:shadow-xl hover:shadow-togo-green/5">
      <ShareCommunityButton
        community={community}
        variant="icon"
        className="absolute right-3 top-3 z-10 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 sm:opacity-100"
      />
      <Link to={communityPublicPath(community)} className="flex h-full flex-col">
        <div className="relative flex items-center gap-4 p-5">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-togo-green/10 to-togo-yellow/10 ring-1 ring-slate-200 dark:ring-slate-700">
            {community.logoUrl ? (
              <img
                src={mediaUrl(community.logoUrl)}
                alt={community.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <span className="grid h-full w-full place-items-center text-lg font-black text-togo-green">
                {community.name.charAt(0)}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1 pr-2">
            <h3 className="truncate text-base font-bold text-slate-900 dark:text-white">
              {community.name}
            </h3>
            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
              <MapPin className="h-3.5 w-3.5 text-togo-red" />
              {formatLocation(community)}
            </p>
          </div>
        </div>

        <p className="line-clamp-3 px-5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {community.description}
        </p>

        <div className="mt-3 px-5">
          <CommunityEngagementBar compact />
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5 px-5 pb-5 pt-1">
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

        <div className="mt-auto flex items-center gap-2 border-t border-slate-100 px-5 py-3 text-xs font-medium text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <Users className="h-3.5 w-3.5 text-togo-green" />
          Animée par {community.leaderName}
        </div>
      </Link>
    </div>
  );
}
