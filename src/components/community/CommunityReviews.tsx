import { useCallback, useEffect, useState } from 'react';
import { Flag, MessageSquare, Reply, Send, Star } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { communityApiRef } from '../../lib/communityUrl';
import { getVisitorId } from '../../lib/visitor';
import { useToast } from '../ui/Toast';
import Spinner from '../ui/Spinner';
import type { Community, CommunityReview, UserReview } from '../../types';

interface Props {
  community: Community;
  /** L'utilisateur peut répondre aux avis (propriétaire / co-lead / admin de la solution). */
  canReply?: boolean;
}

function formatDate(value?: string | null): string {
  if (!value) return '';
  const d = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function CommunityReviews({ community, canReply = false }: Props) {
  const ref = communityApiRef(community);
  const { notify } = useToast();

  const [reviews, setReviews] = useState<CommunityReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [mine, setMine] = useState<UserReview | null>(null);

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api
      .listCommunityReviews(ref)
      .then((res) => setReviews(res.data.reviews))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, [ref]);

  useEffect(() => {
    load();
    api
      .getCommunityEngagement(ref, getVisitorId())
      .then((res) => {
        const ur = res.data.engagement.userReview ?? null;
        setMine(ur);
        if (ur) {
          setRating(ur.rating);
          setTitle(ur.title ?? '');
          setComment(ur.comment);
        } else if (res.data.engagement.userRating) {
          setRating(res.data.engagement.userRating);
        }
      })
      .catch(() => {});
  }, [ref, load]);

  const handleSubmit = async () => {
    if (rating < 1) {
      notify('Sélectionnez une note (1 à 5 étoiles).', 'error');
      return;
    }
    if (comment.trim().length < 3) {
      notify('Votre avis est trop court.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await api.submitCommunityReview(ref, {
        visitorId: getVisitorId(),
        rating,
        title: title.trim() || undefined,
        comment: comment.trim(),
        authorName: authorName.trim() || undefined,
      });
      notify(mine ? 'Votre avis a été mis à jour.' : 'Merci pour votre avis !', 'success');
      load();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Échec de l'envoi de l'avis.", 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFlag = async (reviewId: number) => {
    try {
      const res = await api.flagCommunityReview(ref, reviewId, getVisitorId());
      notify(res.message, 'success');
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Échec du signalement.', 'error');
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-6 flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
          <MessageSquare className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Avis ({reviews.length})
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Partagez votre expérience avec {community.name}
          </p>
        </div>
      </div>

      {/* Formulaire d'avis */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/40">
        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
          {mine ? 'Modifier mon avis' : 'Laisser un avis'}
        </p>
        <div
          className="mt-2 flex items-center gap-1"
          onMouseLeave={() => setHover(0)}
          role="group"
          aria-label="Note de 1 à 5 étoiles"
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHover(star)}
              onClick={() => setRating(star)}
              className="rounded p-0.5 transition-transform hover:scale-110"
              aria-label={`${star} étoile${star > 1 ? 's' : ''}`}
            >
              <Star
                className={`h-6 w-6 ${
                  star <= (hover || rating)
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-slate-300 dark:text-slate-600'
                }`}
              />
            </button>
          ))}
        </div>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={160}
          placeholder="Titre (facultatif)"
          className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-togo-green dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={2000}
          rows={3}
          placeholder="Votre avis détaillé sur cette solution…"
          className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-togo-green dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        <input
          type="text"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          maxLength={120}
          placeholder="Votre nom (facultatif)"
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-togo-green dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="mt-3 inline-flex items-center gap-2 rounded-xl bg-togo-green px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-togo-green-dark disabled:opacity-60 dark:bg-togo-yellow dark:text-slate-900"
        >
          {submitting ? <Spinner /> : <Send className="h-4 w-4" />}
          {mine ? 'Mettre à jour' : 'Publier mon avis'}
        </button>
      </div>

      {/* Liste des avis */}
      <div className="mt-6 space-y-4">
        {loading ? (
          <p className="py-6 text-center text-sm text-slate-400">Chargement des avis…</p>
        ) : reviews.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Aucun avis pour le moment. Soyez le premier à donner votre avis !
          </p>
        ) : (
          reviews.map((review) => (
            <ReviewItem
              key={review.id}
              review={review}
              communityId={community.id ?? 0}
              canReply={canReply}
              onFlag={() => handleFlag(review.id)}
              onReplied={load}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ReviewItem({
  review,
  communityId,
  canReply,
  onFlag,
  onReplied,
}: {
  review: CommunityReview;
  communityId: number;
  canReply: boolean;
  onFlag: () => void;
  onReplied: () => void;
}) {
  const { notify } = useToast();
  const [replying, setReplying] = useState(false);
  const [replyBody, setReplyBody] = useState(review.reply?.body ?? '');
  const [saving, setSaving] = useState(false);

  const submitReply = async () => {
    if (replyBody.trim().length < 1) return;
    setSaving(true);
    try {
      await api.leadReplyToReview(communityId, review.id, replyBody.trim());
      notify('Votre réponse a été publiée.', 'success');
      setReplying(false);
      onReplied();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Échec de la réponse.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`h-3.5 w-3.5 ${
                    s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {review.authorName}
            </span>
          </div>
          {review.title && (
            <p className="mt-1.5 text-sm font-semibold text-slate-900 dark:text-white">{review.title}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onFlag}
          title="Signaler cet avis"
          className="shrink-0 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
          aria-label="Signaler cet avis"
        >
          <Flag className="h-3.5 w-3.5" />
        </button>
      </div>

      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        {review.comment}
      </p>
      {review.createdAt && (
        <p className="mt-2 text-xs text-slate-400">{formatDate(review.createdAt)}</p>
      )}

      {review.reply && (
        <div className="mt-3 rounded-lg border-l-2 border-togo-green bg-slate-50 p-3 dark:border-togo-yellow dark:bg-slate-800/60">
          <p className="flex items-center gap-1.5 text-xs font-bold text-togo-green dark:text-togo-yellow">
            <Reply className="h-3.5 w-3.5" /> Réponse de l'éditeur
          </p>
          <p className="mt-1 whitespace-pre-line text-sm text-slate-600 dark:text-slate-300">
            {review.reply.body}
          </p>
        </div>
      )}

      {canReply && (
        <div className="mt-3">
          {replying ? (
            <div className="space-y-2">
              <textarea
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                rows={2}
                maxLength={2000}
                placeholder="Votre réponse en tant qu'éditeur…"
                className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-togo-green dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={submitReply}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-togo-green px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60 dark:bg-togo-yellow dark:text-slate-900"
                >
                  {saving ? <Spinner /> : <Send className="h-3.5 w-3.5" />} Publier
                </button>
                <button
                  type="button"
                  onClick={() => setReplying(false)}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400"
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setReplying(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-togo-green hover:underline dark:text-togo-yellow"
            >
              <Reply className="h-3.5 w-3.5" /> {review.reply ? 'Modifier la réponse' : 'Répondre'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
