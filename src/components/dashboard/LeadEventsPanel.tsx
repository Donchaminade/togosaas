import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Plus } from 'lucide-react';
import { LeadEventsTable, type EventRow } from './EventsTable';
import Spinner from '../ui/Spinner';
import SearchBar from '../ui/SearchBar';
import SearchEmptyState from '../ui/SearchEmptyState';
import { api } from '../../lib/api';
import { filterBySearch } from '../../lib/search';
import type { Community } from '../../types';

interface Props {
  communities: Community[];
}

export default function LeadEventsPanel({ communities }: Props) {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      const all: EventRow[] = [];
      for (const c of communities) {
        if (!c.id) continue;
        try {
          const res = await api.listCommunityEvents(c.id);
          res.data.events.forEach((e) => all.push({ ...e, communityName: c.name }));
        } catch {
          /* ignore */
        }
      }
      all.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
      setEvents(all);
      setLoading(false);
    })();
  }, [communities]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-8 w-8 text-togo-green" />
      </div>
    );
  }

  const now = Date.now();
  const upcoming = events.filter((e) => new Date(e.startsAt).getTime() >= now - 3600000);
  const past = events.filter((e) => new Date(e.startsAt).getTime() < now - 3600000);

  const filteredUpcoming = useMemo(
    () =>
      filterBySearch(upcoming, search, (e) => [
        e.title,
        e.description,
        e.location,
        e.communityName,
        e.startsAt,
      ]),
    [upcoming, search],
  );

  const filteredPast = useMemo(
    () =>
      filterBySearch(past, search, (e) => [
        e.title,
        e.description,
        e.location,
        e.communityName,
        e.startsAt,
      ]).slice(0, 20),
    [past, search],
  );

  if (events.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
        <div className="px-4 py-14 text-center">
          <Calendar className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-lg font-bold text-slate-700 dark:text-slate-200">Aucun événement</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Ajoutez des meetups, ateliers ou conférences depuis la fiche de chaque communauté.
          </p>
          {communities.length > 0 && communities[0].id && (
            <Link
              to={`/espace-lead/communautes/${communities[0].id}?tab=evenements`}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-togo-green px-4 py-2.5 text-sm font-bold text-white hover:bg-togo-green-dark dark:bg-togo-yellow dark:text-slate-900"
            >
              <Plus className="h-4 w-4" />
              Ajouter un événement
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Rechercher un événement, une communauté, un lieu…"
        size="sm"
        resultCount={filteredUpcoming.length + filteredPast.length}
        totalCount={events.length}
      />

      {search.trim() && filteredUpcoming.length === 0 && filteredPast.length === 0 ? (
        <SearchEmptyState query={search.trim()} />
      ) : (
      <>
      {filteredUpcoming.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-togo-green dark:text-togo-yellow">
              À venir ({filteredUpcoming.length})
            </h3>
          </div>
          <LeadEventsTable events={filteredUpcoming} />
        </section>
      )}

      {filteredPast.length > 0 && (
        <section>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
            Passés ({filteredPast.length})
          </h3>
          <LeadEventsTable events={filteredPast} muted />
        </section>
      )}

      {filteredUpcoming.length === 0 && filteredPast.length > 0 && !search.trim() && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
          Aucun événement à venir pour le moment. Planifiez votre prochain meetup depuis une fiche communauté.
        </p>
      )}
      </>
      )}
    </div>
  );
}
