import { Link } from 'react-router-dom';
import { ExternalLink, Pencil, Trash2 } from 'lucide-react';
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

function formatDateShort(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
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
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/90 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <th className="px-4 py-3">Titre</th>
              <th className="px-4 py-3">Début</th>
              <th className="px-4 py-3">Fin</th>
              <th className="px-4 py-3">Lieu</th>
              <th className="px-4 py-3">Lien</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {events.map((e) => (
              <tr
                key={e.id}
                className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
              >
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900 dark:text-white">{e.title}</p>
                  {e.description && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{e.description}</p>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                  {formatDateShort(e.startsAt)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-500 dark:text-slate-400">
                  {formatDateShort(e.endsAt)}
                </td>
                <td className="max-w-[9rem] truncate px-4 py-3 text-slate-500 dark:text-slate-400">
                  {e.location || '—'}
                </td>
                <td className="px-4 py-3">
                  {e.eventUrl ? (
                    <a
                      href={e.eventUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-togo-green hover:underline dark:text-togo-yellow"
                    >
                      Ouvrir <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(e)}
                      className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-600 transition-colors hover:bg-togo-green hover:text-white dark:bg-slate-800"
                      aria-label="Modifier"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(e)}
                      className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-rose-600 transition-colors hover:bg-rose-600 hover:text-white dark:bg-slate-800"
                      aria-label="Supprimer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
