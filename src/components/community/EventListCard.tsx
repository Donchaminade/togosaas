import { Link } from 'react-router-dom';
import { Calendar, ChevronRight, Clock, MapPin, Pencil, Trash2, Video } from 'lucide-react';
import EventPosterFrame from './EventPosterFrame';
import type { CommunityEvent } from '../../types';

export interface EventListCardProps {
  event: CommunityEvent;
  organizerName: string;
  /** Lien public — mode consultation */
  to?: string;
  /** Mode gestion (lead / admin) */
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function EventListCard({
  event,
  organizerName,
  to,
  onEdit,
  onDelete,
}: EventListCardProps) {
  const start = new Date(event.startsAt);
  const isPast = event.status === 'past' || start.getTime() < Date.now();
  const isManage = Boolean(onEdit || onDelete);

  const inner = (
    <>
      <div className="relative overflow-hidden">
        <EventPosterFrame posterUrl={event.posterUrl} title={event.title} variant="compact" />
        {isPast && (
          <span className={`absolute top-3 inline-flex items-center gap-1 rounded-full bg-rose-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow ${isManage ? 'left-3' : 'right-3'}`}>
            <Video className="h-3 w-3" />
            Passé
          </span>
        )}
        {isManage && (onEdit || onDelete) && (
          <div className="absolute right-3 top-3 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
            {onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onEdit();
                }}
                className="grid h-8 w-8 place-items-center rounded-lg bg-white/95 text-slate-700 shadow-md transition-colors hover:bg-togo-green hover:text-white"
                aria-label="Modifier"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete();
                }}
                className="grid h-8 w-8 place-items-center rounded-lg bg-white/95 text-rose-600 shadow-md transition-colors hover:bg-rose-600 hover:text-white"
                aria-label="Supprimer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
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

        <h4 className="mt-2 line-clamp-2 text-base font-bold text-slate-900 dark:text-white">{event.title}</h4>

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
            <span className="font-semibold text-slate-700 dark:text-slate-200">Par:</span> {organizerName}
          </p>
          {!isManage && (
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-sky-600" />
          )}
        </div>
      </div>
    </>
  );

  const className =
    'group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left transition-all hover:border-sky-400 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900';

  if (to && !isManage) {
    return (
      <Link to={to} className={className}>
        {inner}
      </Link>
    );
  }

  return (
    <article
      className={`${className} ${onEdit ? 'cursor-pointer' : ''}`}
      onClick={onEdit ? onEdit : undefined}
      onKeyDown={
        onEdit
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onEdit();
              }
            }
          : undefined
      }
      role={onEdit ? 'button' : undefined}
      tabIndex={onEdit ? 0 : undefined}
    >
      {inner}
    </article>
  );
}
