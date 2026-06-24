import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Eye } from 'lucide-react';
import AdminReportDetailModal from './AdminReportDetailModal';
import { PageLoader } from '../ui/Spinner';
import SearchBar from '../ui/SearchBar';
import SearchEmptyState from '../ui/SearchEmptyState';
import { useToast } from '../ui/Toast';
import { api } from '../../lib/api';
import { REPORT_STATUS_LABELS, REPORT_TARGET_LABELS } from '../../lib/reportCategories';
import { filterBySearch } from '../../lib/search';
import type { CommunityReport, ReportStatus } from '../../types';

const STATUS_STYLES: Record<ReportStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200',
  investigating: 'bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-200',
  resolved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200',
  dismissed: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

export default function AdminReportsPanel() {
  const { notify } = useToast();
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewingId, setViewingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.adminReports(filter || undefined);
      setReports(res.data.reports);
    } catch {
      notify('Impossible de charger les signalements.', 'error');
    } finally {
      setLoading(false);
    }
  }, [filter, notify]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const filteredReports = useMemo(
    () =>
      filterBySearch(reports, search, (r) => [
        r.id,
        r.communityName,
        r.categoryLabel,
        r.targetType,
        REPORT_TARGET_LABELS[r.targetType],
        REPORT_STATUS_LABELS[r.status],
        r.status,
      ]),
    [reports, search],
  );

  if (loading && reports.length === 0) {
    return <PageLoader label="Chargement des signalements…" />;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4 text-sm leading-relaxed text-slate-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-slate-200">
        Les signalements proviennent de <strong>visiteurs anonymes</strong> ayant constaté un dysfonctionnement
        sur une solution. Traitez-les, enregistrez — ils apparaissent dans le tableau ci-dessous. Cliquez sur
        l&apos;œil pour rouvrir les détails.
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { id: '', label: 'Tous' },
          { id: 'pending', label: 'En attente' },
          { id: 'investigating', label: 'En analyse' },
          { id: 'resolved', label: 'Traités' },
          { id: 'dismissed', label: 'Classés' },
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${
              filter === f.id
                ? 'bg-togo-green text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {reports.length > 0 && (
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Rechercher par solution, type de problème, statut…"
          size="sm"
          resultCount={filteredReports.length}
          totalCount={reports.length}
        />
      )}

      {filteredReports.length === 0 ? (
        search.trim() ? (
          <SearchEmptyState query={search.trim()} />
        ) : (
        <p className="rounded-3xl border border-dashed border-slate-200 px-6 py-16 text-center text-sm text-slate-500 dark:border-slate-700">
          Aucun signalement dans cette catégorie.
        </p>
        )
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="hidden grid-cols-12 gap-3 border-b border-slate-100 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800 sm:grid">
            <span className="col-span-1">#</span>
            <span className="col-span-3">Solution</span>
            <span className="col-span-2">Type de problème</span>
            <span className="col-span-2">Statut</span>
            <span className="col-span-2">Date</span>
            <span className="col-span-2 text-right">Actions</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredReports.map((r) => (
              <div
                key={r.id}
                className="grid grid-cols-12 items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
              >
                <div className="col-span-12 flex items-center gap-2 sm:col-span-1">
                  <AlertTriangle
                    className={`hidden h-4 w-4 shrink-0 sm:block ${
                      r.status === 'pending' ? 'text-amber-500' : 'text-slate-400'
                    }`}
                  />
                  <span className="text-xs font-bold text-slate-500">#{r.id}</span>
                </div>

                <div className="col-span-12 min-w-0 sm:col-span-3">
                  <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{r.communityName}</p>
                  <p className="truncate text-xs text-slate-500 sm:hidden">
                    {REPORT_TARGET_LABELS[r.targetType]}
                  </p>
                </div>

                <div className="col-span-6 hidden truncate text-sm text-slate-600 dark:text-slate-300 sm:col-span-2 sm:block">
                  {r.categoryLabel}
                </div>

                <div className="col-span-6 sm:col-span-2">
                  <span
                    className={`inline-block max-w-full truncate rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${STATUS_STYLES[r.status]}`}
                  >
                    {REPORT_STATUS_LABELS[r.status]}
                  </span>
                </div>

                <div className="col-span-6 hidden text-xs text-slate-500 dark:text-slate-400 sm:col-span-2 sm:block">
                  {new Date(r.createdAt).toLocaleDateString('fr-FR')}
                  {r.reviewedAt && (
                    <span className="mt-0.5 block text-[10px] text-slate-400">
                      Traité le {new Date(r.reviewedAt).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                </div>

                <div className="col-span-6 flex justify-end sm:col-span-2">
                  <button
                    type="button"
                    onClick={() => setViewingId(r.id)}
                    title="Voir et traiter"
                    className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-600 transition-colors hover:bg-togo-green hover:text-white dark:bg-slate-800 dark:text-slate-300"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {viewingId !== null && (
        <AdminReportDetailModal
          reportId={viewingId}
          onClose={() => setViewingId(null)}
          onSaved={load}
          onDeleted={load}
        />
      )}
    </div>
  );
}
