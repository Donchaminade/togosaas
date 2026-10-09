import { Link } from 'react-router-dom';
import { Calendar, Clock, ExternalLink, MapPin, Pencil, Trash2 } from 'lucide-react';
import { isHttpUrl } from '../../lib/externalUrl';
import { mediaUrl } from '../../lib/media';
import type { CommunityEvent } from '../../types';

export type EventRow = CommunityEvent & { communityName?: string };

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface LeadEventsTableProps {
  events: EventRow[];
  showStatus?: boolean;
  muted?: boolean;
}

export function LeadEventsTable({ events, showStatus = false, muted = false }: LeadEventsTableProps) {
  const now = Date.now();

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 ${
        muted ? 'opacity-80' : ''
      }`}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/90 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <th className="px-4 py-3">Événement</th>
              <th className="px-4 py-3">Communauté</th>
              <th className="px-4 py-3">Date & heure</th>
              <th className="px-4 py-3">Lieu</th>
              {showStatus && <th className="px-4 py-3">Statut</th>}
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {events.map((e) => {
              const isUpcoming = new Date(e.startsAt).getTime() >= now - 3600000;
              return (
                <tr
                  key={e.id}
                  className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900 dark:text-white">{e.title}</p>
                    {e.description && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
                        {e.description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-togo-green dark:text-togo-yellow">
                      {e.communityName ?? '—'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                    {formatDate(e.startsAt)}
                  </td>
                  <td className="max-w-[10rem] truncate px-4 py-3 text-slate-500 dark:text-slate-400">
                    {e.location || '—'}
                  </td>
                  {showStatus && (
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          isUpcoming
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {isUpcoming ? 'À venir' : 'Passé'}
                      </span>
                    </td>
                  )}
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/espace-lead/communautes/${e.communityId}?tab=evenements`}
                      className="inline-flex rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition-colors hover:bg-togo-green hover:text-white dark:bg-slate-800 dark:text-slate-200"
                    >
                      Gérer
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface ManageEventsTableProps {
  events: CommunityEvent[];
  onEdit: (event: CommunityEvent) => void;
  onDelete: (event: CommunityEvent) => void;
}

export function ManageEventsTable({ events, onEdit, onDelete }: ManageEventsTableProps) {
  const now = Date.now();

  return (
    <ul className="space-y-3">
      {events.map((e) => {
        const start = new Date(e.startsAt);
        const isPast = start.getTime() < now - 3600000;
        const poster = e.posterUrl ? mediaUrl(e.posterUrl) : null;

        return (
          <li
            key={e.id}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
          >
            <div className="flex flex-col sm:flex-row">
              {poster ? (
                <div className="relative aspect-[16/10] w-full shrink-0 sm:aspect-auto sm:h-auto sm:w-36 md:w-44">
                  <img src={poster} alt="" className="h-full w-full object-cover sm:min-h-[7.5rem]" loading="lazy" />
                </div>
              ) : (
                <div className="grid w-full place-items-center bg-gradient-to-br from-togo-green/10 to-sky-500/10 px-4 py-6 sm:w-28 sm:py-0 md:w-32">
                  <Calendar className="h-8 w-8 text-togo-green dark:text-togo-yellow" />
                </div>
              )}

              <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-slate-900 dark:text-white">{e.title}</h4>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          isPast
                            ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                        }`}
                      >
                        {isPast ? 'Passé' : 'À venir'}
                      </span>
                    </div>
                    {e.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{e.description}</p>
                    )}
                  </div>

                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(e)}
                      className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-600 transition-colors hover:bg-togo-green hover:text-white dark:bg-slate-800 dark:text-slate-200"
                      aria-label="Modifier"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(e)}
                      className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-rose-600 transition-colors hover:bg-rose-600 hover:text-white dark:bg-slate-800"
                      aria-label="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 shrink-0 text-togo-green dark:text-togo-yellow" />
                    {start.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    {start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    {e.endsAt
                      ? ` – ${new Date(e.endsAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
                      : ''}
                  </span>
                  {e.location && (
                    <span className="inline-flex max-w-full items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-togo-red" />
                      <span className="truncate">{e.location}</span>
                    </span>
                  )}
                  {isHttpUrl(e.eventUrl) && (
                    <a
                      href={e.eventUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-togo-green hover:underline dark:text-togo-yellow"
                    >
                      Lien <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
