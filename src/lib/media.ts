const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';

/** URL absolue pour les fichiers stockés sur l'API (/uploads/...) ou assets statiques frontend (/diapo/...). */
export function mediaUrl(path?: string | null): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  /* Assets servis par le frontend Vite (public/) */
  if (path.startsWith('/diapo/') || path.startsWith('/logos') || path.startsWith('/navlogo')) {
    return path;
  }
  const base = API_BASE_URL.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

const IMAGE_EXT = /\.(jpe?g|png|gif|webp)$/i;

export function isImageFile(mime?: string | null, filename?: string | null) {
  const m = mime ?? '';
  if (m.startsWith('image/')) return true;
  const name = filename ?? '';
  return IMAGE_EXT.test(name);
}
