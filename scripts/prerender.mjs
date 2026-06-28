// Pré-rendu SEO post-build pour la SPA Vite (sans SSR ni navigateur headless).
//
// Pour CHAQUE page publique, on génère un fichier HTML statique dérivé de
// `dist/index.html` dans lequel on injecte les bonnes balises <title>, meta
// (description, canonical, Open Graph, Twitter, robots) + le JSON-LD, ainsi
// qu'un bloc de contenu textuel rampable (h1 + description) placé DANS #root.
// React (createRoot) remplace le contenu de #root à l'hydratation, donc le
// bloc SEO disparaît pour l'utilisateur mais reste visible des crawlers qui
// n'exécutent pas le JS.
//
// Les fiches solutions (contenu dynamique) sont récupérées au build depuis
// l'API de production, avec timeout + repli gracieux : le build ne DOIT
// jamais échouer si l'API est injoignable.
//
// Usage : node scripts/prerender.mjs  (lancé automatiquement après `vite build`)

import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const dist = resolve(root, 'dist');

const SITE_URL = (process.env.VITE_SITE_URL || 'https://togosaas.vercel.app').replace(/\/$/, '');
const API_URL = (process.env.VITE_API_URL || 'https://togosaas.grosbit.com').replace(/\/$/, '');
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-preview.png`;
const TODAY = new Date().toISOString().slice(0, 10);

/* ------------------------------------------------------------------ */
/* Utilitaires                                                         */
/* ------------------------------------------------------------------ */

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Sérialise un objet JSON-LD en évitant la fermeture prématurée du <script>. */
function jsonLdTag(data) {
  if (!data) return '';
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return `<script type="application/ld+json" id="seo-jsonld">${json}</script>`;
}

/** Remplace (ou ajoute) le contenu d'une balise meta name=/property=. */
function setMeta(html, attr, key, value) {
  if (value == null) return html;
  const safe = escapeHtml(value);
  const re = new RegExp(`(<meta\\s+${attr}=["']${key}["'][^>]*\\scontent=["'])[^"']*(["'][^>]*>)`, 'i');
  if (re.test(html)) {
    return html.replace(re, `$1${safe}$2`);
  }
  return html.replace('</head>', `    <meta ${attr}="${key}" content="${safe}" />\n  </head>`);
}

function setTitle(html, title) {
  const safe = escapeHtml(title);
  if (/<title>[^<]*<\/title>/i.test(html)) {
    return html.replace(/<title>[^<]*<\/title>/i, `<title>${safe}</title>`);
  }
  return html.replace('</head>', `    <title>${safe}</title>\n  </head>`);
}

function setCanonical(html, url) {
  const safe = escapeHtml(url);
  if (/<link\s+rel=["']canonical["'][^>]*>/i.test(html)) {
    return html.replace(/<link\s+rel=["']canonical["'][^>]*>/i, `<link rel="canonical" href="${safe}" />`);
  }
  return html.replace('</head>', `    <link rel="canonical" href="${safe}" />\n  </head>`);
}

/**
 * Normalise le template : retire tout bloc SEO déjà injecté (contenu #root +
 * JSON-LD) pour que le pré-rendu soit idempotent (le script lit puis réécrit
 * `dist/index.html`, une relance ne doit pas réinjecter par-dessus).
 */
function normalizeTemplate(html) {
  // Réduit un éventuel `<div id="root"><div id="seo-prerender">…</div></div>`
  // (déjà injecté) à un `<div id="root"></div>` vierge.
  html = html.replace(
    /<div id="root">\s*<div id="seo-prerender">[\s\S]*?<\/div>\s*<\/div>/i,
    '<div id="root"></div>',
  );
  html = html.replace(/<script type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi, '');
  return html;
}

/** Construit le HTML final d'une page à partir du template `dist/index.html`. */
function buildPageHtml(template, page) {
  const { path, title, description, image = DEFAULT_OG_IMAGE, type = 'website', jsonLd, content } = page;
  const canonical = /^https?:\/\//.test(path) ? path : `${SITE_URL}${path}`;

  let html = template;
  html = setTitle(html, title);
  html = setMeta(html, 'name', 'description', description);
  html = setMeta(html, 'property', 'og:title', title);
  html = setMeta(html, 'property', 'og:description', description);
  html = setMeta(html, 'property', 'og:url', canonical);
  html = setMeta(html, 'property', 'og:type', type);
  html = setMeta(html, 'property', 'og:image', image);
  html = setMeta(html, 'name', 'twitter:title', title);
  html = setMeta(html, 'name', 'twitter:description', description);
  html = setMeta(html, 'name', 'twitter:image', image);
  html = setMeta(html, 'name', 'twitter:card', 'summary_large_image');
  html = setMeta(html, 'name', 'robots', 'index,follow');
  html = setCanonical(html, canonical);

  // JSON-LD : on retire celui éventuellement présent puis on injecte le nôtre.
  html = html.replace(/<script type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi, '');
  if (jsonLd) {
    html = html.replace('</head>', `    ${jsonLdTag(jsonLd)}\n  </head>`);
  }

  // Contenu rampable injecté DANS #root (remplacé par React à l'hydratation).
  if (content) {
    html = html.replace(
      /<div id="root">\s*<\/div>/i,
      `<div id="root"><div id="seo-prerender">${content}</div></div>`,
    );
  }

  return html;
}

async function writePage(routePath, html) {
  const clean = routePath.replace(/^\/+|\/+$/g, '');
  const dir = clean === '' ? dist : join(dist, clean);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'index.html'), html, 'utf8');
  return clean === '' ? '/' : `/${clean}`;
}

/* ------------------------------------------------------------------ */
/* Métadonnées des pages statiques (alignées avec useSeo côté client)  */
/* ------------------------------------------------------------------ */

function breadcrumb(items) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: `${SITE_URL}${it.path}`,
    })),
  };
}

const ORGANIZATION = {
  '@type': 'Organization',
  name: 'TogoSaaS',
  url: SITE_URL,
  logo: `${SITE_URL}/togosaas-icon.png`,
  description: 'Le hub qui recense, valorise et connecte les solutions SaaS du Togo.',
  areaServed: 'TG',
};

const STATIC_PAGES = [
  {
    path: '/',
    title: 'TogoSaaS — Le hub des solutions SaaS du Togo',
    description:
      'La plateforme qui recense, valorise et connecte toutes les solutions SaaS togolaises — gratuites et payantes. Découvrez, comparez et accédez aux meilleurs outils.',
    changefreq: 'daily',
    priority: '1.0',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          name: 'TogoSaaS',
          url: SITE_URL,
          description: 'Le hub des solutions SaaS du Togo.',
          inLanguage: 'fr',
          potentialAction: {
            '@type': 'SearchAction',
            target: `${SITE_URL}/solutions?q={search_term_string}`,
            'query-input': 'required name=search_term_string',
          },
        },
        ORGANIZATION,
      ],
    },
    content:
      '<h1>TogoSaaS — Le hub des solutions SaaS du Togo</h1>' +
      '<p>TogoSaaS est l’annuaire de référence des solutions SaaS togolaises : ' +
      'découvrez, comparez et accédez aux applications made in Togo, gratuites ou payantes, ' +
      'vérifiées par notre équipe.</p>',
  },
  {
    path: '/solutions',
    title: 'Catalogue des solutions SaaS du Togo — TogoSaaS',
    description:
      'Explorez, filtrez et comparez les solutions SaaS togolaises : recherche par nom, catégorie, ville, tarif, tri par note et popularité.',
    changefreq: 'daily',
    priority: '0.9',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        breadcrumb([
          { name: 'Accueil', path: '/' },
          { name: 'Solutions', path: '/solutions' },
        ]),
      ],
    },
    content:
      '<h1>Catalogue des solutions SaaS du Togo</h1>' +
      '<p>Le catalogue TogoSaaS référence les solutions SaaS togolaises : fintech, RH, ' +
      'e-commerce, éducation, santé et bien plus. Filtrez par catégorie, ville et tarif ' +
      'pour trouver l’outil adapté à votre activité.</p>',
  },
  {
    path: '/a-propos',
    title: 'À propos — TogoSaaS, le hub des solutions SaaS du Togo',
    description:
      'Découvrez TogoSaaS : la première marketplace nationale qui recense, vérifie et valorise les solutions SaaS togolaises. Notre mission, notre vision et notre charte qualité.',
    changefreq: 'monthly',
    priority: '0.6',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        breadcrumb([
          { name: 'Accueil', path: '/' },
          { name: 'À propos', path: '/a-propos' },
        ]),
        ORGANIZATION,
      ],
    },
    content:
      '<h1>À propos de TogoSaaS</h1>' +
      '<p>TogoSaaS (Hub SaaS du Togo) est la première marketplace nationale dédiée au ' +
      'recensement, à la valorisation et à la mise en relation des solutions SaaS togolaises — ' +
      'un pont entre les éditeurs locaux et ceux qui cherchent les bonnes applications.</p>',
  },
  {
    path: '/contact',
    title: 'Contact — TogoSaaS',
    description:
      'Contactez l’équipe TogoSaaS : questions, suggestions, partenariats ou support éditeur. Réponse rapide par email ou via le formulaire de contact.',
    changefreq: 'yearly',
    priority: '0.4',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        breadcrumb([
          { name: 'Accueil', path: '/' },
          { name: 'Contact', path: '/contact' },
        ]),
      ],
    },
    content:
      '<h1>Contacter TogoSaaS</h1>' +
      '<p>Une question, une suggestion ou un partenariat ? Écrivez à l’équipe TogoSaaS, ' +
      'le hub des solutions SaaS du Togo, par email ou via le formulaire de contact.</p>',
  },
  {
    path: '/mentions-legales',
    title: 'Mentions légales — TogoSaaS',
    description:
      'Mentions légales de TogoSaaS : éditeur, hébergement, propriété intellectuelle, données personnelles et cadre juridique de la plateforme.',
    changefreq: 'yearly',
    priority: '0.3',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        breadcrumb([
          { name: 'Accueil', path: '/' },
          { name: 'Mentions légales', path: '/mentions-legales' },
        ]),
      ],
    },
    content:
      '<h1>Mentions légales</h1>' +
      '<p>Informations légales de TogoSaaS : éditeur, directeur de la publication, ' +
      'hébergement, propriété intellectuelle, traitement des données personnelles et ' +
      'droit applicable.</p>',
  },
];

/* ------------------------------------------------------------------ */
/* Fiches solutions (dynamiques, depuis l'API de production)           */
/* ------------------------------------------------------------------ */

function slugify(name) {
  const slug = String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'solution';
}

function mediaUrl(path) {
  if (!path) return '';
  if (/^(https?:|data:)/.test(path)) return path;
  if (/^\/(diapo\/|logo|togosaas|og-)/.test(path)) return `${SITE_URL}${path}`;
  return `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

async function fetchSolutions() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(`${API_URL}/communities`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const payload = await res.json();
    const list = payload?.data?.communities;
    return Array.isArray(list) ? list : [];
  } catch (err) {
    console.warn(`  ! API injoignable (${err?.message ?? err}) — pré-rendu des fiches ignoré.`);
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

/** Tronque proprement sur une limite de mot (≈ longueur max), avec ellipse. */
function truncate(text, max = 160) {
  const clean = String(text).replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 60 ? cut.slice(0, lastSpace) : cut).replace(/[.,;:!?\s]+$/, '')}…`;
}

function solutionPage(c) {
  const slug = (c.slug && String(c.slug).trim()) || slugify(c.name);
  const path = `/solutions/${slug}`;
  const description = truncate(
    c.shortDescription || c.description || `Découvrez ${c.name} sur TogoSaaS.`,
  );
  const imgPath = c.bannerUrl || c.logoUrl;
  const image = imgPath ? mediaUrl(imgPath) : DEFAULT_OG_IMAGE;

  const software = {
    '@type': 'SoftwareApplication',
    name: c.name,
    description,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: `${SITE_URL}${path}`,
    ...(imgPath ? { image } : {}),
    ...(c.websiteUrl ? { sameAs: [c.websiteUrl] } : {}),
    offers: {
      '@type': 'Offer',
      price: c.priceAmount ?? 0,
      priceCurrency: c.currency || 'XOF',
    },
    ...(c.ratingAvg && (c.reviewsCount ?? 0) > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: c.ratingAvg,
            reviewCount: c.reviewsCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };

  const ratingText =
    c.ratingAvg && (c.reviewsCount ?? 0) > 0
      ? `<p>Note moyenne : ${Number(c.ratingAvg).toFixed(1)}/5 (${c.reviewsCount} avis).</p>`
      : '';

  return {
    path,
    title: `${c.name} — TogoSaaS`,
    description,
    image,
    type: 'product',
    lastmod: (c.updatedAt || c.createdAt || TODAY).slice(0, 10),
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        software,
        breadcrumb([
          { name: 'Accueil', path: '/' },
          { name: 'Solutions', path: '/solutions' },
          { name: c.name, path },
        ]),
      ],
    },
    content:
      `<h1>${escapeHtml(c.name)}</h1>` +
      `<p>${escapeHtml(description)}</p>` +
      ratingText +
      '<p><a href="/solutions">← Retour au catalogue des solutions SaaS du Togo</a></p>',
  };
}

/* ------------------------------------------------------------------ */
/* Sitemap & robots                                                    */
/* ------------------------------------------------------------------ */

function buildSitemap(entries) {
  const body = entries
    .map(
      (e) =>
        '  <url>\n' +
        `    <loc>${escapeHtml(e.loc)}</loc>\n` +
        `    <lastmod>${e.lastmod}</lastmod>\n` +
        `    <changefreq>${e.changefreq}</changefreq>\n` +
        `    <priority>${e.priority}</priority>\n` +
        '  </url>',
    )
    .join('\n');
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    body +
    '\n</urlset>\n'
  );
}

function buildRobots() {
  return (
    'User-agent: *\n' +
    'Allow: /\n\n' +
    '# Espaces privés (non indexés)\n' +
    'Disallow: /admin\n' +
    'Disallow: /espace-lead\n' +
    'Disallow: /connexion\n' +
    'Disallow: /inscription\n' +
    'Disallow: /verifier-email\n\n' +
    `Sitemap: ${SITE_URL}/sitemap.xml\n`
  );
}

/* ------------------------------------------------------------------ */
/* Exécution                                                           */
/* ------------------------------------------------------------------ */

async function main() {
  console.log('==> Pré-rendu SEO');
  console.log(`    SITE_URL = ${SITE_URL}`);
  console.log(`    API_URL  = ${API_URL}`);

  const template = normalizeTemplate(await readFile(join(dist, 'index.html'), 'utf8'));

  const sitemapEntries = [];

  // Pages statiques.
  for (const page of STATIC_PAGES) {
    const html = buildPageHtml(template, page);
    const url = await writePage(page.path, html);
    sitemapEntries.push({
      loc: `${SITE_URL}${url === '/' ? '/' : url}`,
      lastmod: TODAY,
      changefreq: page.changefreq,
      priority: page.priority,
    });
    console.log(`  + ${url}`);
  }

  // Fiches solutions (dynamiques).
  const solutions = await fetchSolutions();
  console.log(`    ${solutions.length} fiche(s) solution récupérée(s).`);
  for (const c of solutions) {
    try {
      const page = solutionPage(c);
      const html = buildPageHtml(template, page);
      const url = await writePage(page.path, html);
      sitemapEntries.push({
        loc: `${SITE_URL}${url}`,
        lastmod: page.lastmod,
        changefreq: 'weekly',
        priority: '0.8',
      });
    } catch (err) {
      console.warn(`  ! Fiche ignorée (${c?.name ?? '??'}) : ${err?.message ?? err}`);
    }
  }

  // Sitemap + robots.
  await writeFile(join(dist, 'sitemap.xml'), buildSitemap(sitemapEntries), 'utf8');
  await writeFile(join(dist, 'robots.txt'), buildRobots(), 'utf8');
  console.log(`  + /sitemap.xml (${sitemapEntries.length} URLs)`);
  console.log('  + /robots.txt');
  console.log('Pré-rendu terminé.');
}

main().catch((err) => {
  // Le build NE DOIT PAS échouer à cause du pré-rendu : dist/index.html (SPA)
  // reste déployable. On journalise et on sort proprement.
  console.error('!! Échec du pré-rendu (build conservé) :', err);
  process.exit(0);
});
