import { useCallback, useEffect, useState } from 'react';
import { Eye, EyeOff, Flag, MessageSquare, Star, Trash2 } from 'lucide-react';
import { PageLoader } from '../ui/Spinner';
import { useToast } from '../ui/Toast';
import { useConfirm } from '../ui/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { api, ApiError } from '../../lib/api';
import type { AdminReview } from '../../types';

export default function AdminReviewsPanel() {
  const { notify } = useToast();
  const { confirmDelete } = useConfirm();
  const { isSuperAdmin } = useAuth();
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api
      .adminReviews(flaggedOnly)
      .then((res) => setReviews(res.data.reviews))
      .catch(() => notify('Erreur de chargement des avis.', 'error'))
      .finally(() => setLoading(false));
  }, [flaggedOnly, notify]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleStatus = async (review: AdminReview) => {
    const next = review.status === 'visible' ? 'hidden' : 'visible';
    setBusyId(review.id);
    try {
      await api.adminUpdateReview(review.id, next);
      notify(next === 'hidden' ? 'Avis masqué.' : 'Avis de nouveau visible.', 'success');
      setReviews((prev) => prev.map((r) => (r.id === review.id ? { ...r, status: next } : r)));
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Action impossible.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (review: AdminReview) => {
    const ok = await confirmDelete(
      `Supprimer définitivement le commentaire de « ${review.authorName} » ?\n\nLa note en étoiles est conservée dans les statistiques.`,
    );
    if (!ok) return;
    setBusyId(review.id);
    try {
      await api.adminDeleteReview(review.id);
      notify('Avis supprimé.', 'success');
      setReviews((prev) => prev.filter((r) => r.id !== review.id));
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Suppression impossible.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <PageLoader label="Chargement des avis..." />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setFlaggedOnly(false)}
          className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${
            !flaggedOnly ? 'bg-togo-green text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          Tous les avis
        </button>
        <button
          onClick={() => setFlaggedOnly(true)}
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-colors ${
            flaggedOnly ? 'bg-togo-red text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          <Flag className="h-3.5 w-3.5" /> Signalés
        </button>
      </div>

      {reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <MessageSquare className="h-12 w-12 text-slate-300" />
          <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">
            {flaggedOnly ? 'Aucun avis signalé.' : 'Aucun avis pour le moment.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div
              key={review.id}
              className={`rounded-2xl border p-5 transition-colors ${
                review.status === 'hidden'
                  ? 'border-slate-200 bg-slate-50 opacity-70 dark:border-slate-800 dark:bg-slate-900/50'
                  : review.flagsCount > 0
                    ? 'border-rose-200 bg-rose-50/40 dark:border-rose-500/20 dark:bg-rose-500/5'
                    : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-3.5 w-3.5 ${s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{review.authorName}</span>
                    <span className="text-xs text-slate-400">sur</span>
                    <span className="text-xs font-semibold text-togo-green dark:text-togo-yellow">{review.communityName}</span>
                    {review.flagsCount > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
                        <Flag className="h-3 w-3" /> {review.flagsCount}
                      </span>
                    )}
                    {review.status === 'hidden' && (
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                        Masqué
                      </span>
                    )}
                  </div>
                  {review.title && (
                    <p className="mt-1.5 text-sm font-semibold text-slate-900 dark:text-white">{review.title}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => toggleStatus(review)}
                    disabled={busyId === review.id}
                    title={review.status === 'visible' ? 'Masquer' : 'Réafficher'}
                    className="grid h-8 w-8 place-items-center rounded-lg bg-amber-100 text-amber-700 transition-colors hover:bg-amber-500 hover:text-white disabled:opacity-50 dark:bg-amber-500/15 dark:text-amber-400"
                  >
                    {review.status === 'visible' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  {isSuperAdmin && (
                    <button
                      onClick={() => remove(review)}
                      disabled={busyId === review.id}
                      title="Supprimer définitivement"
                      className="grid h-8 w-8 place-items-center rounded-lg bg-rose-100 text-rose-700 transition-colors hover:bg-rose-600 hover:text-white disabled:opacity-50 dark:bg-rose-500/15 dark:text-rose-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {review.comment}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
