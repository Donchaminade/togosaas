import type { Community } from '../types';

/** Affiche « Ville, Pays » ou seulement le pays si pas de ville. */
export function formatLocation(c: Pick<Community, 'country' | 'city'>): string {
  const country = c.country?.trim();
  const city = c.city?.trim();
  if (city && country) return `${city}, ${country}`;
  return country || '—';
}
