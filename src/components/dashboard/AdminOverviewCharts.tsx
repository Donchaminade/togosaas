import { useMemo } from 'react';
import { MapPin, Users2 } from 'lucide-react';
import { resolveTogoCity } from '../../data/togoData';
import type { Community } from '../../types';

const TOP_N = 6;

interface BarItem {
  label: string;
  value: number;
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

  const topByMembers = useMemo((): BarItem[] => {
    return [...communities]
      .filter((c) => (c.memberCount ?? 0) > 0)
      .sort((a, b) => (b.memberCount ?? 0) - (a.memberCount ?? 0))
      .slice(0, TOP_N)
      .map((c) => ({ label: c.name, value: c.memberCount ?? 0 }));
  }, [communities]);

  const maxCity = Math.max(...topCities.map((x) => x.value), 1);
  const maxMembers = Math.max(...topByMembers.map((x) => x.value), 1);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <ChartPanel
        icon={MapPin}
        title="Villes les plus actives"
        subtitle="Nombre de solutions SaaS recensées par ville"
        empty="Aucune solution SaaS avec ville renseignée."
        items={topCities}
        max={maxCity}
        barClassName="bg-sky-500"
        valueSuffix=""
      />
      <ChartPanel
        icon={Users2}
        title="Communautés les plus grandes"
        subtitle="Classement par nombre de membres déclarés"
        empty="Aucune communauté n'a renseigné son effectif."
        items={topByMembers}
        max={maxMembers}
        barClassName="bg-togo-green dark:bg-togo-yellow"
        valueSuffix=" membres"
        formatValue={(n) => n.toLocaleString('fr-FR')}
      />
    </div>
  );
}

function ChartPanel({
  icon: Icon,
  title,
  subtitle,
  empty,
  items,
  max,
  barClassName,
  valueSuffix = '',
  formatValue = (n: number) => String(n),
}: {
  icon: typeof MapPin;
  title: string;
  subtitle: string;
  empty: string;
  items: BarItem[];
  max: number;
  barClassName: string;
  valueSuffix?: string;
  formatValue?: (n: number) => string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400">{title}</h3>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700">
          {empty}
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {items.map((item, i) => {
            const pct = Math.round((item.value / max) * 100);
            return (
              <div key={`${item.label}-${i}`}>
                <div className="mb-1.5 flex items-baseline justify-between gap-3">
                  <span className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200" title={item.label}>
                    {item.label}
                  </span>
                  <span className="shrink-0 text-sm font-black text-slate-900 dark:text-white">
                    {formatValue(item.value)}
                    {valueSuffix}
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barClassName}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
