import { useMemo } from 'react';
import { Building2, MapPin, Sparkles, Tags, Users, X } from 'lucide-react';
import ScrollReveal from './motion/ScrollReveal';
import { TOGO_CITIES, resolveTogoCity } from '../data/togoData';
import type { Community } from '../types';
import type { TogoCity } from '../data/togoData';

interface Props {
  communities: Community[];
  selectedCity: string | null;
  onSelectCity: (city: string | null) => void;
}

export default function CommunitiesExplorer({
  communities,
  selectedCity,
  onSelectCity,
}: Props) {
  const stats = useMemo(() => {
    const tags = new Set<string>();
    const cities = new Set<TogoCity>();
    communities.forEach((c) => {
      c.tags.forEach((t) => tags.add(t));
      const resolved = resolveTogoCity(c.city);
      if (resolved) cities.add(resolved);
    });
    return {
      total: communities.length,
      cities: cities.size,
      tags: tags.size,
    };
  }, [communities]);

  const cityCounts = useMemo(() => {
    const counts: Partial<Record<TogoCity, number>> = {};
    communities.forEach((c) => {
      const city = resolveTogoCity(c.city);
      if (city) counts[city] = (counts[city] || 0) + 1;
    });
    return counts;
  }, [communities]);

  const filteredCount = useMemo(() => {
    if (!selectedCity) return communities.length;
    return communities.filter((c) => resolveTogoCity(c.city) === selectedCity).length;
  }, [communities, selectedCity]);

  return (
    <div className="mt-8 space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: Users, label: 'Communautés', value: stats.total, accent: 'text-togo-green bg-togo-green/10' },
          { icon: MapPin, label: 'Villes couvertes', value: stats.cities, accent: 'text-sky-600 bg-sky-100 dark:bg-sky-500/15' },
          { icon: Tags, label: 'Thématiques', value: stats.tags, accent: 'text-togo-yellow-dark bg-togo-yellow/20 dark:text-togo-yellow' },
        ].map((s, i) => (
          <ScrollReveal key={s.label} variant="gentle-up" delay={i * 90} duration={650}>
            <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
              <span className={`grid h-11 w-11 place-items-center rounded-xl ${s.accent}`}>
                <s.icon className="h-5 w-5" />
              </span>
              <p className="mt-4 text-3xl font-black text-slate-900 dark:text-white">{s.value}</p>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{s.label}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>

      <ScrollReveal variant="fade-up" delay={120}>
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50/80 to-emerald-50/30 p-6 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-togo-green text-white shadow-lg shadow-togo-green/25">
                <Building2 className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">Explorer par ville</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Les grandes villes du Togo — filtre facultatif
                </p>
              </div>
            </div>
            {selectedCity && (
              <button
                onClick={() => onSelectCity(null)}
                className="inline-flex items-center gap-2 self-start rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition-colors hover:border-togo-red hover:text-togo-red dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                <X className="h-3.5 w-3.5" /> Effacer le filtre
              </button>
            )}
          </div>

          <div className="mt-5 flex h-1 overflow-hidden rounded-full">
            <div className="flex-1 bg-togo-green" />
            <div className="flex-1 bg-togo-yellow" />
            <div className="flex-1 bg-togo-red" />
          </div>

          <div className="mt-6">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Villes du Togo</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onSelectCity(null)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
                  !selectedCity
                    ? 'bg-togo-green text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                Toutes
              </button>
              {TOGO_CITIES.map((city) => {
                const count = cityCounts[city] || 0;
                const isActive = selectedCity === city;
                return (
                  <button
                    key={city}
                    type="button"
                    onClick={() => onSelectCity(isActive ? null : city)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
                      isActive
                        ? 'bg-togo-green text-white'
                        : count > 0
                          ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                          : 'bg-slate-100/60 text-slate-400 hover:bg-slate-200 dark:bg-slate-800/60 dark:text-slate-500'
                    }`}
                  >
                    {city}
                    {count > 0 && (
                      <span className={`ml-1.5 ${isActive ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'}`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedCity && (
            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-togo-green/20 bg-togo-green/5 p-4 animate-fade-in dark:border-togo-yellow/20 dark:bg-togo-yellow/5">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-togo-green dark:text-togo-yellow" />
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {selectedCity}, Togo — {filteredCount} communauté{filteredCount !== 1 ? 's' : ''}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  Communautés basées à {selectedCity} ou dans ses environs.
                </p>
              </div>
            </div>
          )}
        </div>
      </ScrollReveal>
    </div>
  );
}
