/** Images locales — dossier public/diapo (aucune URL externe). */
export const DIAPO_IMAGES = [
  '/diapo/_MG_0735.jpg',
  '/diapo/CCS_5506.jpg',
  '/diapo/CCS_5535.jpg',
  '/diapo/IMG_0121.jpg',
  '/diapo/IMG_0186.jpg',
  '/diapo/IMG_9473.jpg',
  '/diapo/IMG_9477.jpg',
  '/diapo/IMG_9584.jpg',
  '/diapo/IMG_9584%20(1).jpg',
  '/diapo/IMG_9590.jpg',
  '/diapo/PXL_20260516_090047229.jpg',
] as const;

export const HERO_SLIDES = DIAPO_IMAGES.map((src, i) => ({
  src,
  alt: 'Communautés togolaises',
})) as { src: (typeof DIAPO_IMAGES)[number]; alt: string }[];

/** Images dédiées aux bannières de pages */
export const DIAPO = {
  communitiesBanner: '/diapo/IMG_9477.jpg',
  aboutHero: '/diapo/CCS_5506.jpg',
  aboutSection: '/diapo/IMG_0121.jpg',
  contactBanner: '/diapo/CCS_5535.jpg',
  reportTrackBanner: '/diapo/IMG_0186.jpg',
  reportBanner: '/diapo/IMG_9473.jpg',
} as const;
