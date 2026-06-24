import { useMemo } from 'react';
import { Crown, MapPin, Star, Trophy, Users2 } from 'lucide-react';
import { resolveTogoCity } from '../../data/togoData';
import { useCountUp, useMounted } from '../../hooks/useCountUp';
import { StaggerReveal } from '../motion/ScrollReveal';
import type { Community } from '../../types';

const TOP_N = 6;

interface BarItem {
  label: string;
  value: number;
}

interface RatedItem {
  label: string;
  avgRating: number;
  reviewsCount: number;
}

interface Props {
  communities: Community[];
}

export default function AdminOverviewCharts({ communities }: Props) {
  const topCities = useMemo((): BarItem[] => {
    const counts: Record<string, number> = {};
    communities.forEach((c) => {
      const city = resolveTogoCity(c.city) ?? 'Non renseignée';
      counts[city] = (counts[city] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOP_N)
      .map(([label, value]) => ({ label, value }));
  }, [communities]);

  const topByRating = useMemo((): RatedItem[] => {
    return communities
      .filter((c) => (c.reviewsCount ?? 0) > 0 && c.ratingAvg != null)
      .sort(
        (a, b) =>
          (b.ratingAvg ?? 0) - (a.ratingAvg ?? 0) ||
          (b.reviewsCount ?? 0) - (a.reviewsCount ?? 0),
      )
      .slice(0, TOP_N)
      .map((c) => ({
        label: c.name,
        avgRating: c.ratingAvg ?? 0,
        reviewsCount: c.reviewsCount ?? 0,
      }));
  }, [communities]);

  const maxCity = Math.max(...topCities.map((x) => x.value), 1);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <StaggerReveal index={0} variant="gentle-up" stagger={130} maxDelay={260}>
        <ChartPanel
          icon={MapPin}
          iconClass="bg-gradient-to-br from-sky-400 to-sky-500 text-white shadow-lg shadow-sky-500/30"
          title="Villes les plus actives"
          subtitle="Nombre de solutions SaaS recensées par ville"
        >
          {topCities.length === 0 ? (
            <EmptyHint label="Aucune solution SaaS avec ville renseignée." />
          ) : (
            <div className="mt-6 space-y-4">
              {topCities.map((item, i) => (
                <CityBar key={`${item.label}-${i}`} rank={i + 1} label={item.label} value={item.value} max={maxCity} />
              ))}
            </div>
          )}
        </ChartPanel>
      </StaggerReveal>

      <StaggerReveal index={1} variant="gentle-up" stagger={130} maxDelay={260}>
        <ChartPanel
          icon={Trophy}
          iconClass="bg-gradient-to-br from-togo-yellow to-togo-yellow-dark text-togo-ink shadow-lg shadow-togo-yellow/30"
          title="Solutions les mieux notées"
          subtitle="Classement par note moyenne en étoiles"
        >
          {topByRating.length === 0 ? (
            <EmptyHint label="Aucune solution SaaS n'a encore reçu d'avis." />
          ) : (
            <div className="mt-5 space-y-1.5">
              {topByRating.map((item, i) => (
                <RankRow
                  key={`${item.label}-${i}`}
                  rank={i + 1}
                  label={item.label}
                  avgRating={item.avgRating}
                  reviewsCount={item.reviewsCount}
                />
              ))}
            </div>
          )}
        </ChartPanel>
      </StaggerReveal>
    </div>
  );
}

function ChartPanel({
  icon: Icon,
  iconClass,
  title,
  subtitle,
  children,
}: {
  icon: typeof MapPin;
  iconClass: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="h-full rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start gap-3">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${iconClass}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400">{title}</h3>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function CityBar({ rank, label, value, max }: { rank: number; label: string; value: number; max: number }) {
  const mounted = useMounted();
  const display = useCountUp(value);
  const pct = Math.round((value / max) * 100);
  return (
    <div className="group">
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2">
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-slate-100 text-[11px] font-black text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            {rank}
          </span>
          <span className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200" title={label}>
            {label}
          </span>
        </span>
        <span className="shrink-0 text-sm font-black tabular-nums text-slate-900 dark:text-white">{display}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-400 to-sky-600"
          style={{ width: mounted ? `${pct}%` : '0%', transition: 'width 1.1s cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </div>
    </div>
  );
}

const MEDALS: Record<number, { ring: string; badge: string }> = {
  1: { ring: 'ring-amber-300/60', badge: 'bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950' },
  2: { ring: 'ring-slate-300/60', badge: 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-700' },
  3: { ring: 'ring-orange-300/60', badge: 'bg-gradient-to-br from-orange-300 to-orange-500 text-orange-950' },
};

function RankRow({
  rank,
  label,
  avgRating,
  reviewsCount,
}: {
  rank: number;
  label: string;
  avgRating: number;
  reviewsCount: number;
}) {
  const medal = MEDALS[rank];
  const ratingLabel = avgRating.toLocaleString('fr-FR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  return (
    <div className="group flex items-center gap-3 rounded-2xl px-2.5 py-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60">
      <span
        className={`relative grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-black ${
          medal ? `${medal.badge} shadow-sm ring-2 ${medal.ring}` : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
        }`}
      >
        {rank === 1 ? <Crown className="h-4 w-4" /> : rank}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700 dark:text-slate-200" title={label}>
        {label}
      </span>
      <span className="flex shrink-0 items-center gap-1.5">
        <span className="flex items-center gap-1 text-sm font-black tabular-nums text-slate-900 dark:text-white">
          <Star className="h-4 w-4 fill-togo-yellow text-togo-yellow" />
          {ratingLabel}
        </span>
        <span className="text-xs font-medium text-slate-400">·</span>
        <span className="text-xs font-medium text-slate-400">
          {reviewsCount.toLocaleString('fr-FR')} avis
        </span>
      </span>
    </div>
  );
}

function EmptyHint({ label }: { label: string }) {
  return (
    <p className="mt-8 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700">
      <Users2 className="h-4 w-4 shrink-0 text-slate-400" /> {label}
    </p>
  );
}
