export interface CountryData {
  code: string;
  name: string;
}

export const DEFAULT_COUNTRY = 'Togo';

/** Grandes villes du Togo pour le filtre annuaire. */
export const TOGO_CITIES = [
  'Lomé',
  'Sokodé',
  'Kara',
  'Kpalimé',
  'Atakpamé',
  'Dapaong',
  'Tsévié',
  'Aného',
  'Mango',
  'Niamtougou',
  'Bassar',
  'Tabligbo',
  'Vogan',
  'Notsé',
] as const;

export type TogoCity = (typeof TOGO_CITIES)[number];

/** Indice quartier → ville parente (filtre annuaire : villes uniquement). */
const LOME_QUARTIER_HINTS = [
  'adidogom',
  'agoe',
  'nyekonakpo',
  'tokoin',
  'cocotier',
  'totsi',
  'cacaveli',
  'ameyib',
  'agoe-nyive',
  'bè',
  'be ',
  'kodjoviakope',
  'dékon',
  'dekon',
];

function normalizeCityKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim();
}

/** Rattache une valeur saisie (ville ou quartier) à une grande ville du Togo. */
export function resolveTogoCity(city?: string | null): TogoCity | null {
  const raw = city?.trim();
  if (!raw) return null;

  const key = normalizeCityKey(raw);

  for (const c of TOGO_CITIES) {
    if (normalizeCityKey(c) === key) return c;
  }

  if (key.startsWith('lome') || key.includes('lome —') || key.includes('lome -')) {
    return 'Lomé';
  }

  if (LOME_QUARTIER_HINTS.some((hint) => key.includes(hint))) {
    return 'Lomé';
  }

  return null;
}

export const COUNTRIES: CountryData[] = [
  { code: 'TG', name: 'Togo' },
  { code: 'BJ', name: 'Bénin' },
  { code: 'BF', name: 'Burkina Faso' },
  { code: 'CI', name: 'Côte d\'Ivoire' },
  { code: 'GH', name: 'Ghana' },
  { code: 'GN', name: 'Guinée' },
  { code: 'ML', name: 'Mali' },
  { code: 'NE', name: 'Niger' },
  { code: 'SN', name: 'Sénégal' },
  { code: 'CM', name: 'Cameroun' },
  { code: 'FR', name: 'France' },
  { code: 'BE', name: 'Belgique' },
  { code: 'CA', name: 'Canada' },
  { code: 'US', name: 'États-Unis' },
];

export const AVAILABLE_TAGS = [
  'CRM',
  'Facturation',
  'Comptabilité',
  'E-commerce',
  'RH & Paie',
  'Gestion de stock',
  'Éducation',
  'Santé',
  'Agriculture',
  'Logistique',
  'Immobilier',
  'Marketing',
  'Communication',
  'Paiement mobile',
  'Banque & Finance',
  'Assurance',
  'Juridique',
  'Productivité',
  'Collaboration',
  'Analytics',
  'IA / ML',
  'Sécurité',
  'Open Source',
];
