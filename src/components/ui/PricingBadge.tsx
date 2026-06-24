import { formatPrice, pricingBadgeClass } from '../../lib/pricing';
import type { Community, PricingType } from '../../types';

interface PricingBadgeProps {
  pricingType?: PricingType;
  priceAmount?: number | null;
  currency?: string;
  billingPeriod?: Community['billingPeriod'];
  size?: 'sm' | 'md';
  className?: string;
}

export default function PricingBadge({
  pricingType = 'free',
  priceAmount,
  currency = 'XOF',
  billingPeriod,
  size = 'sm',
  className = '',
}: PricingBadgeProps) {
  const label = formatPrice(pricingType, priceAmount, currency, billingPeriod);
  const sizeClass = size === 'md' ? 'px-3 py-1 text-xs' : 'px-2.5 py-0.5 text-[11px]';

  return (
    <span
      className={`inline-flex items-center rounded-full font-bold uppercase tracking-wide shadow-sm ${sizeClass} ${pricingBadgeClass(pricingType)} ${className}`}
    >
      {label}
    </span>
  );
}
