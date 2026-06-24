const PRODUCTION_API_URL = 'https://togosaas.grosbit.com';

/** URL de l'API — VITE_API_URL en priorite, sinon fallback prod / local. */
export function resolveApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  if (import.meta.env.PROD) return PRODUCTION_API_URL;

  return 'http://localhost:8000';
}

export const API_BASE_URL = resolveApiBaseUrl();
