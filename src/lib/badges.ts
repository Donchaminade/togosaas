import type { Community } from '../types';

export type BadgeTone = 'amber' | 'emerald' | 'sky';

export interface CommunityBadge {
  key: 'top-rated' | 'new';
  label: string;
  tone: BadgeTone;
  title: string;
}

/** Note minimale et nombre d'avis pour le badge « Top noté ». */
const TOP_RATED_MIN_AVG = 4.5;
const TOP_RATED_MIN_REVIEWS = 3;

/** Age maximal (jours) pour le badge « Nouveau ». */
const NEW_MAX_DAYS = 30;

function daysSince(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  const time = new Date(dateStr.replace(' ', 'T')).getTime();
  if (Number.isNaN(time)) return null;
  return (Date.now() - time) / (1000 * 60 * 60 * 24);
}

/**
 * Badges de confiance calcules UNIQUEMENT a partir des donnees deja presentes
 * (ratingAvg, reviewsCount, createdAt). Aucune colonne supplementaire requise.
 */
export function communityBadges(community: Community): CommunityBadge[] {
  const badges: CommunityBadge[] = [];

  const avg = community.ratingAvg ?? 0;
  const count = community.reviewsCount ?? 0;
  if (avg >= TOP_RATED_MIN_AVG && count >= TOP_RATED_MIN_REVIEWS) {
    badges.push({
      key: 'top-rated',
      label: 'Top noté',
      tone: 'amber',
      title: `Note moyenne de ${avg.toFixed(1)}/5 sur ${count} avis`,
    });
  }

  const age = daysSince(community.createdAt);
  if (age !== null && age <= NEW_MAX_DAYS) {
    badges.push({
      key: 'new',
      label: 'Nouveau',
      tone: 'emerald',
      title: 'Publié il y a moins de 30 jours',
    });
  }

  return badges;
}

export const BADGE_TONE_CLASSES: Record<BadgeTone, string> = {
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  sky: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
};
