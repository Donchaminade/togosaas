import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import type { CommunityStatus } from '../../types';

const MAP: Record<CommunityStatus, { label: string; icon: any; className: string }> = {
  approved: {
    label: 'Approuvée',
    icon: CheckCircle2,
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  },
  pending: {
    label: 'En attente',
    icon: Clock,
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  },
  rejected: {
    label: 'Rejetée',
    icon: XCircle,
    className: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400',
  },
};

export default function StatusBadge({ status }: { status: CommunityStatus }) {
  const cfg = MAP[status];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${cfg.className}`}>
      <Icon className="h-3.5 w-3.5" />
      {cfg.label}
    </span>
  );
}
