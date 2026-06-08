import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, ExternalLink, MapPin, Video } from 'lucide-react';
import { PageLoader } from '../components/ui/Spinner';
import { api } from '../lib/api';
import { communityPublicPath } from '../lib/communityUrl';
import { mediaUrl } from '../lib/media';
import type { CommunityEvent } from '../types';

export default function CommunityEventDetail() {
  const { id: communityRef, eventId } = useParams<{ id: string; eventId: string }>();
  const [event, setEvent] = useState<CommunityEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!communityRef || !eventId) return;
    api
      .getCommunityEvent(communityRef, Number(eventId))
      .then((res) => setEvent(res.data.event))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [communityRef, eventId]);

  if (loading) {
    return <PageLoader label="Chargement de l'événement..." />;
  }

  if (error || !event) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <p className="text-lg font-bold text-slate-700 dark:text-slate-200">Événement introuvable</p>
        {communityRef && (
          <Link
            to={`/communautes/${communityRef}`}
            className="mt-4 text-sm font-semibold text-togo-green hover:underline dark:text-togo-yellow"
          >
            ← Retour à la communauté
          </Link>
        )}
      </div>
    );
  }

  const start = new Date(event.startsAt);
  const end = event.endsAt ? new Date(event.endsAt) : null;
  const isPast = event.status === 'past' || start.getTime() < Date.now();
  const communityPath = communityPublicPath({
    id: event.communityId,
    slug: event.communitySlug,
    name: event.communityName ?? 'communaute',
  });

  return (
    <article className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        to={`${communityPath}?tab=events`}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-sky-300 hover:text-sky-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-sky-500 dark:hover:text-sky-300"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux événements
      </Link>

      <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="relative">
          {event.posterUrl ? (
            <img
              src={mediaUrl(event.posterUrl)}
              alt=""
              className="max-h-[420px] w-full object-cover"
            />
          ) : (
            <div className="flex min-h-[220px] items-center justify-center bg-gradient-to-br from-sky-600 to-sky-900 p-10">
              <h1 className="text-center text-2xl font-black text-white sm:text-3xl">{event.title}</h1>
            </div>
          )}
          {isPast && (
            <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white shadow">
              <Video className="h-3.5 w-3.5" />
              Passé
            </span>
          )}
        </div>

        <div className="p-6 sm:p-8">
          {event.posterUrl && (
            <h1 className="text-2xl font-black text-slate-900 sm:text-3xl dark:text-white">{event.title}</h1>
          )}

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-300">
            <span className="inline-flex items-center gap-2">
              <Calendar className="h-4 w-4 text-togo-green dark:text-togo-yellow" />
              {start.toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              {end ? ` – ${end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : ''}
            </span>
            {event.location && (
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-togo-red" />
                {event.location}
              </span>
            )}
          </div>

          {event.organizerName && (
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              Organisé par{' '}
              <Link to={communityPath} className="font-semibold text-sky-700 hover:underline dark:text-sky-300">
                {event.organizerName}
              </Link>
            </p>
          )}

          {event.description && (
            <div className="mt-6 whitespace-pre-line text-base leading-relaxed text-slate-700 dark:text-slate-200">
              {event.description}
            </div>
          )}

          {event.eventUrl && (
            <a
              href={event.eventUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-togo-green px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-togo-green-dark dark:bg-togo-yellow dark:text-slate-900 dark:hover:bg-togo-yellow/90"
            >
              <ExternalLink className="h-4 w-4" />
              S&apos;inscrire / En savoir plus
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
