import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  CalendarDays,
  LayoutGrid,
  List,
} from 'lucide-react';
import CommunityEventsCalendar from '../CommunityEventsCalendar';
import EventListCard from './EventListCard';
import EventPosterFrame, { EventPosterPlaceholder } from './EventPosterFrame';
import { communityEventPath } from '../../lib/communityUrl';
import type { Community, CommunityEvent } from '../../types';

type ViewMode = 'list' | 'grid' | 'calendar';

interface Props {
  community: Community;
  events: CommunityEvent[];
}

export default function CommunityEventsExplorer({ community, events }: Props) {
  const [view, setView] = useState<ViewMode>('list');

  const sorted = useMemo(
    () =>
      [...events].sort(
        (a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime(),
      ),
    [events],
  );

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-togo-green/10 text-togo-green dark:bg-togo-yellow/10 dark:text-togo-yellow">
            <Calendar className="h-4 w-4" />
          </span>
          Événements du Chapitre ({events.length})
        </h3>

        <div className="inline-flex self-start rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-900">
          {(
            [
              { id: 'list' as const, label: 'Liste', icon: List },
              { id: 'grid' as const, label: 'Grille', icon: LayoutGrid },
              { id: 'calendar' as const, label: 'Calendrier', icon: CalendarDays },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                view === id
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {view === 'grid' && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {sorted.map((event) => (
              <Link
                key={event.id}
                to={communityEventPath(community, event.id)}
                className="group flex aspect-square flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 transition-all hover:border-sky-400 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800"
              >
                {event.posterUrl ? (
                  <EventPosterFrame
                    posterUrl={event.posterUrl}
                    title={event.title}
                    variant="compact"
                    className="h-full min-h-0 flex-1"
                  />
                ) : (
                  <EventPosterPlaceholder title={event.title} className="h-full flex-1" />
                )}
              </Link>
            ))}
          </div>
        )}

        {view === 'list' && (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {sorted.map((event) => (
              <EventListCard
                key={event.id}
                event={event}
                organizerName={community.name}
                to={communityEventPath(community, event.id)}
              />
            ))}
          </div>
        )}

        {view === 'calendar' && <CommunityEventsCalendar events={events} embedded />}
      </div>
    </div>
  );
}
