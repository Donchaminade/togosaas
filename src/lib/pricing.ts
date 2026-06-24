import type { BillingPeriod, Community, PricingType } from '../types';

export const PRICING_LABELS: Record<PricingType, string> = {
  free: 'Gratuit',
  freemium: 'Freemium',
  paid: 'Payant',
};

export const BILLING_LABELS: Record<BillingPeriod, string> = {
  monthly: '/ mois',
  yearly: '/ an',
  one_time: ' (unique)',
};

export function formatPrice(
  pricingType: PricingType = 'free',
  priceAmount?: number | null,
  currency = 'XOF',
  billingPeriod?: BillingPeriod | null
): string {
  if (pricingType === 'free') return 'Gratuit';
  if (pricingType === 'freemium' && (priceAmount == null || priceAmount <= 0)) {
    return 'Freemium';
  }
  if (priceAmount == null || priceAmount <= 0) {
    return PRICING_LABELS[pricingType];
  }

  const formatted = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency === 'XOF' ? 'XOF' : currency,
    maximumFractionDigits: currency === 'XOF' ? 0 : 2,
  }).format(priceAmount);

  const suffix = billingPeriod ? BILLING_LABELS[billingPeriod] : '';
  return `${formatted}${suffix}`;
}

export function pricingBadgeClass(pricingType: PricingType = 'free'): string {
  switch (pricingType) {
    case 'free':
      return 'bg-emerald-100 text-emerald-800 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30';
    case 'freemium':
      return 'bg-sky-100 text-sky-800 ring-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-500/30';
    case 'paid':
      return 'bg-amber-100 text-amber-900 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-500/30';
    default:
      return 'bg-slate-100 text-slate-700 ring-slate-200';
  }
}

export function solutionAccessUrl(community: Pick<Community, 'appUrl' | 'websiteUrl' | 'demoUrl'>): string | null {
  return community.appUrl?.trim() || community.websiteUrl?.trim() || community.demoUrl?.trim() || null;
}
