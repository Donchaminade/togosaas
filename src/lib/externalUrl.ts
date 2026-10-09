/** Lien affichable dans un href : uniquement http(s), pour bloquer javascript: et data:. */
export function isHttpUrl(url: string | null | undefined): url is string {
  return typeof url === 'string' && /^https?:\/\//i.test(url);
}

/** Normalise une URL saisie (avec ou sans https://) pour les liens externes. */
export function externalUrl(url: string | null | undefined): string | null {
  const trimmed = url?.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/** Affiche un libellé court pour un site (domaine sans www). */
export function websiteLabel(url: string): string {
  try {
    const host = new URL(externalUrl(url) ?? url).hostname.replace(/^www\./, '');
    return host || url;
  } catch {
    return url;
  }
}
