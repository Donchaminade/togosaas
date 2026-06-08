import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  CalendarDays,
  ChevronRight,
  Clock,
  LayoutGrid,
  List,
  MapPin,
  Video,
} from 'lucide-react';
import CommunityEventsCalendar from '../CommunityEventsCalendar';
import { communityEventPath } from '../../lib/communityUrl';
import { mediaUrl } from '../../lib/media';
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
                className="group aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 transition-all hover:border-sky-400 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800"
              >
                {event.posterUrl ? (
                  <img
                    src={mediaUrl(event.posterUrl)}
                    alt={event.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-sky-50 to-slate-100 p-3 text-center dark:from-sky-950/40 dark:to-slate-900">
                    <Calendar className="h-8 w-8 text-sky-400" />
                    <span className="line-clamp-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {event.title}
                    </span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}

        {view === 'list' && (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {sorted.map((event) => (
              <EventListCard key={event.id} community={community} event={event} />
            ))}
          </div>
        )}

        {view === 'calendar' && <CommunityEventsCalendar events={events} embedded />}
      </div>
    </div>
  );
}

function EventListCard({ community, event }: { community: Community; event: CommunityEvent }) {
  const start = new Date(event.startsAt);
  const isPast = event.status === 'past' || start.getTime() < Date.now();
  const organizer = community.name;

  return (
    <Link
      to={communityEventPath(community, event.id)}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all hover:border-sky-400 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-800">
        {event.posterUrl ? (
          <img
            src={mediaUrl(event.posterUrl)}
            alt=""
            className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-sky-600 to-sky-800 p-6">
            <p className="text-center text-lg font-black leading-tight text-white">{event.title}</p>
          </div>
        )}
        {isPast && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-rose-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow">
            <Video className="h-3 w-3" />
            Passé
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <h4 className="mt-2 line-clamp-2 text-base font-bold text-slate-900 dark:text-white">
          {event.title}
        </h4>

        {event.description && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {event.description}
          </p>
        )}

        {event.location && (
          <p className="mt-2 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-togo-red" />
            <span className="line-clamp-1">{event.location}</span>
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-200">Par:</span> {organizer}
          </p>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-sky-600" />
        </div>
      </div>
    </Link>
  );
}
