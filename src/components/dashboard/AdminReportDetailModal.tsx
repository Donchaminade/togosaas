import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ExternalLink,
  Eye,
  MessageSquareWarning,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import ReportEvidencePreview from '../reports/ReportEvidencePreview';
import Spinner from '../ui/Spinner';
import { useToast } from '../ui/Toast';
import { useConfirm } from '../ui/ConfirmDialog';
import { api, ApiError } from '../../lib/api';
import { REPORT_STATUS_LABELS, REPORT_TARGET_LABELS } from '../../lib/reportCategories';
import type { CommunityReport, ReportStatus } from '../../types';

const STATUS_OPTIONS: ReportStatus[] = ['pending', 'investigating', 'resolved', 'dismissed'];

interface Props {
  reportId: number;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}

export default function AdminReportDetailModal({ reportId, onClose, onSaved, onDeleted }: Props) {
  const { notify } = useToast();
  const { confirmDelete } = useConfirm();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<CommunityReport | null>(null);
  const [status, setStatus] = useState<ReportStatus>('pending');
  const [adminNotes, setAdminNotes] = useState('');
  const [adminAction, setAdminAction] = useState('');
  const [warning, setWarning] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sendingWarn, setSendingWarn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .adminGetReport(reportId)
      .then((res) => {
        if (cancelled) return;
        setReport(res.data.report);
        setStatus(res.data.report.status);
        setAdminNotes(res.data.report.adminNotes ?? '');
        setAdminAction(res.data.report.adminAction ?? '');
      })
      .catch(() => {
        if (!cancelled) {
          notify('Signalement introuvable.', 'error');
          onClose();
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reportId, notify, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const save = async () => {
    if (!report) return;
    setSaving(true);
    try {
      await api.adminUpdateReport(report.id, { status, adminNotes, adminAction });
      notify('Signalement enregistré.', 'success');
      onSaved();
      onClose();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Erreur.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const destroy = async () => {
    if (!report) return;
    const ok = await confirmDelete(
      `Supprimer définitivement le signalement #${report.id} (${report.communityName}) ?\n\nCette action est irréversible.`,
    );
    if (!ok) return;
    setDeleting(true);
    try {
      await api.adminDeleteReport(report.id);
      notify('Signalement supprimé.', 'success');
      onDeleted();
      onClose();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Suppression impossible.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const sendWarning = async () => {
    if (!report?.ownerId || !warning.trim()) return;
    setSendingWarn(true);
    try {
      await api.adminSendSupportMessage(report.ownerId, {
        body: `[Avertissement Togosaas — signalement #${report.id}]\n\n${warning.trim()}`,
      });
      notify('Avertissement envoyé au lead via le chat Togosaas.', 'success');
      setWarning('');
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Envoi impossible.', 'error');
    } finally {
      setSendingWarn(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/60 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-5 dark:border-slate-800">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase text-slate-400">
              Signalement #{reportId}
            </p>
            <h2 className="truncate text-lg font-black text-slate-900 dark:text-white">
              {report?.communityName ?? 'Chargement…'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading || !report ? (
            <div className="flex justify-center py-16">
              <Spinner className="h-8 w-8 text-togo-green" />
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">
                    {report.categoryLabel} — {REPORT_TARGET_LABELS[report.targetType]}
                  </p>
                </div>
                <code className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-mono dark:bg-slate-800">
                  {report.trackingCode}
                </code>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  to={`/admin/communautes/${report.communityId}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-togo-green hover:text-white dark:bg-slate-800 dark:text-slate-300"
                >
                  <Eye className="h-3.5 w-3.5" /> Fiche communauté
                </Link>
                {report.ownerId && (
                  <Link
                    to={`/admin/leads/${report.ownerId}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-togo-green hover:text-white dark:bg-slate-800 dark:text-slate-300"
                  >
                    <Eye className="h-3.5 w-3.5" /> Fiche lead
                  </Link>
                )}
                <a
                  href={`/communautes/${report.communityId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Page publique
                </a>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900/50">
                <p className="text-xs font-bold uppercase text-slate-400">Description</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                  {report.description}
                </p>
              </div>

              {report.evidence && report.evidence.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-bold uppercase text-slate-400">
                    Preuves ({report.evidence.length})
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {report.evidence.map((f, i) => (
                      <ReportEvidencePreview
                        key={f.key}
                        reportId={report.id}
                        index={i}
                        file={f}
                        evidenceUrl={api.adminReportEvidenceUrl}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase text-slate-400">Statut</span>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ReportStatus)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {REPORT_STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="text-xs text-slate-500 dark:text-slate-400 sm:self-end">
                  Lead : {report.ownerName ?? report.leaderName ?? '—'}
                  {report.ownerEmail && <span className="block">{report.ownerEmail}</span>}
                </div>
              </div>

              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase text-slate-400">Notes internes</span>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  placeholder="Enquête, éléments vérifiés, décisions…"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase text-slate-400">Action menée</span>
                <textarea
                  value={adminAction}
                  onChange={(e) => setAdminAction(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  placeholder="Avertissement, demande de correction, suspension…"
                />
              </label>

              {report.ownerId && (
                <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
                  <p className="flex items-center gap-2 text-sm font-bold text-amber-900 dark:text-amber-100">
                    <MessageSquareWarning className="h-4 w-4" /> Avertir le lead
                  </p>
                  <textarea
                    value={warning}
                    onChange={(e) => setWarning(e.target.value)}
                    rows={3}
                    className="mt-2 w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm dark:border-amber-800 dark:bg-slate-900 dark:text-white"
                    placeholder="Message d'avertissement officiel…"
                  />
                  <button
                    type="button"
                    onClick={sendWarning}
                    disabled={sendingWarn || !warning.trim()}
                    className="mt-2 rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
                  >
                    {sendingWarn ? 'Envoi…' : 'Envoyer l\'avertissement'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {!loading && report && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
            <button
              type="button"
              onClick={destroy}
              disabled={deleting || saving}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-bold text-rose-700 transition-colors hover:bg-rose-50 disabled:opacity-50 dark:border-rose-500/30 dark:text-rose-400 dark:hover:bg-rose-500/10"
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? 'Suppression…' : 'Supprimer'}
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving || deleting}
                className="inline-flex items-center gap-2 rounded-xl bg-togo-green px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >
                <Save className="h-4 w-4" /> Enregistrer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
