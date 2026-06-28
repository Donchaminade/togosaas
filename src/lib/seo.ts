import { useEffect } from 'react';

/** URL publique du site (frontend). Sert aux balises canoniques et Open Graph. */
export const SITE_URL: string = (
  import.meta.env.VITE_SITE_URL?.trim() ||
  (typeof window !== 'undefined' ? window.location.origin : 'https://togosaas.vercel.app')
).replace(/\/$/, '');

const DEFAULT_OG_IMAGE = `${SITE_URL}/og-preview.png`;

export interface SeoOptions {
  title: string;
  description?: string;
  /** Chemin (ex: /solutions/mon-app) ou URL absolue. Defaut: page courante. */
  path?: string;
  image?: string;
  type?: 'website' | 'article' | 'product';
  /** Donnees structurees JSON-LD (objet schema.org). */
  jsonLd?: Record<string, unknown> | null;
  /** Empeche l'indexation (pages privees). */
  noIndex?: boolean;
}

function setMeta(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

const JSON_LD_ID = 'seo-jsonld';

/**
 * Gestion dynamique du <title> et des meta (description, Open Graph, Twitter,
 * canonical, JSON-LD) pour cette SPA Vite (sans SSR).
 */
export function useSeo(options: SeoOptions): void {
  const {
    title,
    description,
    path,
    image = DEFAULT_OG_IMAGE,
    type = 'website',
    jsonLd = null,
    noIndex = false,
  } = options;

  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    const url =
      path && /^https?:\/\//.test(path)
        ? path
        : `${SITE_URL}${path ?? (typeof window !== 'undefined' ? window.location.pathname : '/')}`;

    if (description) {
      setMeta('meta[name="description"]', 'name', 'description', description);
      setMeta('meta[property="og:description"]', 'property', 'og:description', description);
      setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    }

    setMeta('meta[property="og:title"]', 'property', 'og:title', title);
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title);
    setMeta('meta[property="og:type"]', 'property', 'og:type', type);
    setMeta('meta[property="og:url"]', 'property', 'og:url', url);
    setMeta('meta[property="og:site_name"]', 'property', 'og:site_name', 'TogoSaaS — Hub SaaS du Togo');
    setMeta('meta[property="og:locale"]', 'property', 'og:locale', 'fr_FR');
    setMeta('meta[property="og:image"]', 'property', 'og:image', image);
    setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', image);
    setMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    setMeta('meta[name="robots"]', 'name', 'robots', noIndex ? 'noindex,nofollow' : 'index,follow');

    setLink('canonical', url);

    // JSON-LD : on remplace l'unique balise dediee.
    const existing = document.getElementById(JSON_LD_ID);
    if (existing) existing.remove();
    if (jsonLd) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = JSON_LD_ID;
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }

    return () => {
      document.title = previousTitle;
      const node = document.getElementById(JSON_LD_ID);
      if (node) node.remove();
    };
  }, [title, description, path, image, type, jsonLd, noIndex]);
}
