import { Plus } from 'lucide-react';
import type { CommunityEvent } from '../../types';
import EventListCard from '../community/EventListCard';

interface Props {
  title?: string;
  count: number;
  events: CommunityEvent[];
  organizerName: string;
  getEventLink?: (event: CommunityEvent) => string;
  onAdd?: () => void;
  onEdit?: (event: CommunityEvent) => void;
  onDelete?: (event: CommunityEvent) => void;
  addLabel?: string;
  emptyMessage?: string;
}

export default function EventsCardGrid({
  title = 'Événements',
  count,
  events,
  organizerName,
  getEventLink,
  onAdd,
  onEdit,
  onDelete,
  addLabel = 'Ajouter un événement',
  emptyMessage = 'Aucun événement publié pour le moment.',
}: Props) {
  const hasManageActions = Boolean(onEdit || onDelete);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-black text-slate-900 dark:text-white">
          {title} <span className="text-slate-400">({count})</span>
        </h3>
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="group inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-gradient-to-r from-togo-green to-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-togo-green/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-togo-green/40 active:translate-y-0 dark:from-togo-yellow dark:to-amber-400 dark:text-slate-900 dark:shadow-togo-yellow/20 dark:hover:shadow-togo-yellow/35"
          >
            <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
            {addLabel}
          </button>
        )}
      </div>

      {events.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 px-6 py-14 text-center dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">{emptyMessage}</p>
          {onAdd && (
            <button
              type="button"
              onClick={onAdd}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-togo-green px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-togo-green-dark dark:bg-togo-yellow dark:text-slate-900"
            >
              <Plus className="h-4 w-4" />
              {addLabel}
            </button>
          )}
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {events.map((event) => (
            <EventListCard
              key={event.id}
              event={event}
              organizerName={organizerName}
              to={getEventLink && !hasManageActions ? getEventLink(event) : undefined}
              onEdit={onEdit ? () => onEdit(event) : undefined}
              onDelete={onDelete ? () => onDelete(event) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
