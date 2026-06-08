/** Slug URL à partir du nom (aligné avec le backend PHP). */
export function slugifyCommunityName(name: string): string {
  const slug = name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'communaute';
}

export interface CommunityLinkTarget {
  id?: number;
  slug?: string | null;
  name: string;
}

/** Chemin public d'une fiche communauté, ex. /communautes/designers-du-togo-ux-ui */
export function communityPublicPath(community: CommunityLinkTarget): string {
  const slug = community.slug?.trim() || slugifyCommunityName(community.name);
  return `/communautes/${slug}`;
}

export function communityEventPath(community: CommunityLinkTarget, eventId: number): string {
  return `${communityPublicPath(community)}/evenements/${eventId}`;
}

export function communityPublicUrl(community: CommunityLinkTarget): string {
  const path = communityPublicPath(community);
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${path}`;
  }
  return path;
}

/** Identifiant utilisable par l'API : slug en priorité, sinon id numérique. */
export function communityApiRef(community: CommunityLinkTarget): string {
  if (community.slug?.trim()) return community.slug.trim();
  if (community.id != null) return String(community.id);
  return slugifyCommunityName(community.name);
}
