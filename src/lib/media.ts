import { API_BASE_URL } from './apiBase';

/** URL absolue pour les fichiers stockés sur l'API (/uploads/...) ou assets statiques frontend (/diapo/...). */
export function mediaUrl(path?: string | null): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  /* Assets servis par le frontend Vite (public/) */
  if (
    path.startsWith('/diapo/') ||
    path.startsWith('/logo') ||
    path.startsWith('/togosaas') ||
    path.startsWith('/og-')
  ) {
    return path;
  }
  const base = API_BASE_URL.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Affiche / logo par défaut des communautés sans visuel uploadé (public/). */
export const DEFAULT_COMMUNITY_COVER = '/logofondnoir.png';

/** Bannière ou logo communauté, sinon visuel Togosaas par défaut. */
export function communityCoverUrl(community: {
  bannerUrl?: string | null;
  logoUrl?: string | null;
}): string {
  const path = community.bannerUrl?.trim() || community.logoUrl?.trim();
  if (!path) return DEFAULT_COMMUNITY_COVER;
  return mediaUrl(path);
}

const IMAGE_EXT = /\.(jpe?g|png|gif|webp)$/i;

export function isImageFile(mime?: string | null, filename?: string | null) {
  const m = mime ?? '';
  if (m.startsWith('image/')) return true;
  const name = filename ?? '';
  return IMAGE_EXT.test(name);
}
