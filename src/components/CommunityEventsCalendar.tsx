import { useMemo } from 'react';
import { Calendar, Clock, ExternalLink, MapPin } from 'lucide-react';
import ScrollReveal from './motion/ScrollReveal';
import type { CommunityEvent } from '../types';

interface Props {
  events: CommunityEvent[];
  showPast?: boolean;
  embedded?: boolean;
}

export default function CommunityEventsCalendar({ events, showPast = true, embedded = false }: Props) {
  const now = Date.now();

  const { upcoming, past } = useMemo(() => {
    const up: CommunityEvent[] = [];
    const pa: CommunityEvent[] = [];
    events.forEach((e) => {
      const start = new Date(e.startsAt).getTime();
      if (start >= now - 3600000) up.push(e);
      else pa.push(e);
    });
    up.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
    pa.sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());
    return { upcoming: up, past: pa };
  }, [events, now]);

  if (events.length === 0) return null;

  const inner = (
    <>
      {!embedded && (
        <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
          <Calendar className="h-4 w-4 text-togo-green dark:text-togo-yellow" />
          Calendrier événementiel
        </h3>
      )}

      {upcoming.length > 0 && (
        <div className={`space-y-3 ${embedded ? '' : 'mt-5'}`}>
          <p className="text-[11px] font-bold uppercase tracking-wider text-togo-green dark:text-togo-yellow">
            À venir
          </p>
          {upcoming.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      )}

      {showPast && past.length > 0 && (
        <div className={`space-y-3 ${upcoming.length > 0 ? 'mt-8' : embedded ? '' : 'mt-5'}`}>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Passés</p>
          {past.map((e) => (
            <EventCard key={e.id} event={e} past />
          ))}
        </div>
      )}

      {upcoming.length === 0 && past.length === 0 && (
        <p className={`text-sm text-slate-500 dark:text-slate-400 ${embedded ? '' : 'mt-4'}`}>
          Aucun événement pour le moment.
        </p>
      )}
    </>
  );

  if (embedded) {
    return inner;
  }

  return (
    <ScrollReveal variant="fade-up" delay={80}>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        {inner}
      </div>
    </ScrollReveal>
  );
}

function EventCard({ event, past }: { event: CommunityEvent; past?: boolean }) {
  const start = new Date(event.startsAt);
  const end = event.endsAt ? new Date(event.endsAt) : null;

  return (
    <article
      className={`flex gap-4 rounded-2xl border p-4 transition-colors ${
        past
          ? 'border-slate-100 bg-slate-50/50 opacity-75 dark:border-slate-800 dark:bg-slate-900/50'
          : 'border-togo-green/20 bg-togo-green/5 dark:border-togo-yellow/20 dark:bg-togo-yellow/5'
      }`}
    >
      <div
        className={`grid h-14 w-14 shrink-0 place-items-center rounded-xl text-center ${
          past ? 'bg-slate-200 dark:bg-slate-800' : 'bg-togo-green text-white dark:bg-togo-green'
        }`}
      >
        <div>
          <p className="text-[10px] font-bold uppercase leading-none opacity-80">
            {start.toLocaleDateString('fr-FR', { month: 'short' })}
          </p>
          <p className="text-lg font-black leading-tight">{start.getDate()}</p>
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <h4 className="font-bold text-slate-900 dark:text-white">{event.title}</h4>
        {event.description && (
          <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{event.description}</p>
        )}
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {formatEventTime(start, end)}
          </span>
          {event.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-togo-red" />
              {event.location}
            </span>
          )}
        </div>
        {event.eventUrl && (
          <a
            href={event.eventUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-togo-green hover:underline dark:text-togo-yellow"
          >
            <ExternalLink className="h-3.5 w-3.5" /> En savoir plus / S'inscrire
          </a>
        )}
      </div>
    </article>
  );
}

function formatEventTime(start: Date, end: Date | null): string {
  const dateStr = start.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: start.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
  const timeStr = start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  if (!end) return `${dateStr} · ${timeStr}`;
  const endStr = end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return `${dateStr} · ${timeStr} – ${endStr}`;
}
