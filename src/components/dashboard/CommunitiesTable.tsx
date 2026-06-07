import { Link } from 'react-router-dom';
import { Calendar, Pencil, Trash2 } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatLocation } from '../../lib/location';
import { mediaUrl } from '../../lib/media';
import type { Community } from '../../types';

interface CommunitiesTableProps {
  communities: Community[];
  onDelete: (c: Community) => void;
}

export function CommunitiesTable({ communities, onDelete }: CommunitiesTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/90 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <th className="px-4 py-3">Communauté</th>
              <th className="px-4 py-3">Localisation</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Rôle</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {communities.map((c) => {
              const isCoLead = c.membershipRole === 'co_lead';
              return (
                <tr
                  key={c.id}
                  className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-togo-green/10 to-togo-yellow/10 ring-1 ring-slate-200 dark:ring-slate-700">
                        {c.logoUrl ? (
                          <img
                            src={mediaUrl(c.logoUrl)}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="grid h-full w-full place-items-center text-sm font-black text-togo-green">
                            {c.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900 dark:text-white">
                          {c.name}
                        </p>
                        <p className="line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
                          {c.shortDescription || c.description}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                    {formatLocation(c)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-3">
                    {isCoLead ? (
                      <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-500/15 dark:text-amber-200">
                        Co-lead
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Responsable
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Link
                        to={`/espace-lead/communautes/${c.id}?tab=evenements`}
                        className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-togo-green transition-colors hover:bg-togo-green hover:text-white dark:bg-slate-800 dark:text-togo-yellow"
                        title="Événements"
                      >
                        <Calendar className="h-3.5 w-3.5" />
                      </Link>
                      <Link
                        to={`/espace-lead/communautes/${c.id}`}
                        className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                        title={isCoLead ? 'Gérer' : 'Modifier'}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>
                      {!isCoLead && (
                        <button
                          type="button"
                          onClick={() => onDelete(c)}
                          className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-rose-600 transition-colors hover:bg-rose-600 hover:text-white dark:bg-slate-800"
                          title="Supprimer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
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
