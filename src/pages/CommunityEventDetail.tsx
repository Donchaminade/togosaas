import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  CalendarClock,
  Circle,
  ExternalLink,
  MapPin,
  Video,
} from 'lucide-react';
import EventShareSidebar from '../components/community/EventShareSidebar';
import EventPosterFrame from '../components/community/EventPosterFrame';
import { PageLoader } from '../components/ui/Spinner';
import { api } from '../lib/api';
import { communityEventUrl, communityPublicPath } from '../lib/communityUrl';
import { mediaUrl } from '../lib/media';
import type { Community, CommunityEvent } from '../types';

function isVirtualEvent(event: CommunityEvent): boolean {
  const loc = (event.location ?? '').toLowerCase();
  if (/en ligne|online|virtuel|visio|zoom|meet|teams|discord|webinaire|distanciel/.test(loc)) {
    return true;
  }
  return Boolean(event.eventUrl && !event.location?.trim());
}

function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTimeRange(start: Date, end: Date | null): string {
  const startStr = start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  if (!end) return startStr;
  return `${startStr} – ${end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
}

export default function CommunityEventDetail() {
  const { id: communityRef, eventId } = useParams<{ id: string; eventId: string }>();
  const [event, setEvent] = useState<CommunityEvent | null>(null);
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!communityRef || !eventId) return;
    Promise.all([
      api.getCommunityEvent(communityRef, Number(eventId)),
      api.getCommunity(communityRef).catch(() => null),
    ])
      .then(([eventRes, communityRes]) => {
        setEvent(eventRes.data.event);
        if (communityRes) setCommunity(communityRes.data.community);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [communityRef, eventId]);

  const communityTarget = useMemo(
    () => ({
      id: event?.communityId ?? community?.id,
      slug: event?.communitySlug ?? community?.slug,
      name: event?.communityName ?? community?.name ?? 'communaute',
    }),
    [event, community],
  );

  if (loading) {
    return (
      <div className="pt-below-nav">
        <PageLoader label="Chargement de l'événement..." />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 pt-below-nav text-center">
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
  const isVirtual = isVirtualEvent(event);
  const communityPath = communityPublicPath(communityTarget);
  const shareUrl = communityEventUrl(communityTarget, event.id);
  const organizerName = event.organizerName ?? community?.leaderName ?? event.communityName ?? 'Organisateur';
  const logoUrl = community?.logoUrl ? mediaUrl(community.logoUrl) : null;

  return (
    <div className="min-h-screen bg-slate-50 pt-below-nav dark:bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 pb-12 pt-6 sm:px-6 sm:pb-16 sm:pt-8 lg:px-8">
        <Link
          to={`${communityPath}?tab=events`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux événements
        </Link>

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-12">
          {/* Colonne principale */}
          <div className="min-w-0 space-y-8">
            <div className="flex flex-wrap gap-2">
              <Badge
                tone={isPast ? 'neutral' : 'success'}
                icon={isPast ? Circle : CalendarClock}
              >
                {isPast ? 'Passé' : 'À venir'}
              </Badge>
              {isVirtual && (
                <Badge tone="info" icon={Video}>
                  Virtuel
                </Badge>
              )}
              {!isVirtual && event.location && (
                <Badge tone="warning" icon={MapPin}>
                  Présentiel
                </Badge>
              )}
              <Badge tone="free">Gratuit</Badge>
            </div>

            <div>
              <h1 className="text-2xl font-black leading-tight text-slate-900 sm:text-3xl lg:text-4xl dark:text-white">
                {event.title}
              </h1>

              <div className="mt-4 flex items-center gap-3">
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-togo-green/20 to-sky-500/20 ring-2 ring-white dark:ring-slate-800">
                  {logoUrl ? (
                    <img src={logoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="grid h-full w-full place-items-center text-sm font-black text-togo-green dark:text-togo-yellow">
                      {organizerName.charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Organisateur principal</p>
                  <Link
                    to={communityPath}
                    className="font-bold text-slate-900 hover:text-sky-600 dark:text-white dark:hover:text-sky-400"
                  >
                    {organizerName}
                  </Link>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <EventPosterFrame posterUrl={event.posterUrl} title={event.title} variant="hero" />
            </div>

            {event.description && (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">À propos de cet événement</h2>
                <div className="mt-4 whitespace-pre-line text-base leading-relaxed text-slate-600 dark:text-slate-300">
                  {event.description}
                </div>
              </section>
            )}

            {event.eventUrl && !isPast && (
              <a
                href={event.eventUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-togo-green px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-togo-green/20 transition-colors hover:bg-togo-green-dark dark:bg-togo-yellow dark:text-slate-900 dark:shadow-togo-yellow/20 dark:hover:bg-yellow-400"
              >
                <ExternalLink className="h-4 w-4" />
                S&apos;inscrire / En savoir plus
              </a>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-5 lg:sticky lg:top-below-nav lg:self-start">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="bg-sky-600 p-5 text-white dark:bg-sky-700">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-sky-100">Date de l&apos;événement</p>
                    <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-sky-200">Début</p>
                    <p className="mt-1 text-xl font-bold capitalize">{formatEventDate(event.startsAt)}</p>
                    <p className="mt-2 text-sm font-medium text-sky-50">{formatTimeRange(start, end)}</p>
                  </div>
                  <Calendar className="h-10 w-10 shrink-0 text-sky-200" strokeWidth={1.5} />
                </div>
              </div>

              {(event.location || isVirtual) && (
                <div className="flex items-start gap-2 border-t border-slate-100 px-5 py-4 dark:border-slate-800">
                  {isVirtual ? (
                    <Video className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
                  ) : (
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-togo-red" />
                  )}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {isVirtual ? 'Format' : 'Lieu'}
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-slate-700 dark:text-slate-200">
                      {isVirtual ? 'En ligne / visioconférence' : event.location}
                    </p>
                  </div>
                </div>
              )}

              {community?.memberCount != null && community.memberCount > 0 && (
                <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 dark:border-slate-800">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    <span className="font-bold text-slate-800 dark:text-slate-100">
                      {community.memberCount.toLocaleString('fr-FR')}
                    </span>{' '}
                    membres
                  </p>
                  <span className="rounded-full bg-sky-100 px-2.5 py-1 text-[10px] font-bold text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
                    Communauté
                  </span>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
              {isPast ? (
                <>
                  <CalendarClock className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" strokeWidth={1.5} />
                  <p className="mt-3 font-bold text-slate-900 dark:text-white">Événement terminé</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Cet événement est déjà passé
                  </p>
                </>
              ) : (
                <>
                  <Calendar className="mx-auto h-10 w-10 text-togo-green dark:text-togo-yellow" strokeWidth={1.5} />
                  <p className="mt-3 font-bold text-slate-900 dark:text-white">Événement à venir</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Rejoignez-nous le {formatEventDate(event.startsAt)}
                  </p>
                  {event.eventUrl && (
                    <a
                      href={event.eventUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-sky-700"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Participer
                    </a>
                  )}
                </>
              )}
            </div>

            <EventShareSidebar url={shareUrl} title={event.title} />
          </aside>
        </div>
      </div>
    </div>
  );
}

function Badge({
  children,
  tone,
  icon: Icon,
}: {
  children: ReactNode;
  tone: 'neutral' | 'success' | 'info' | 'warning' | 'free';
  icon?: typeof Circle;
}) {
  const styles = {
    neutral: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    info: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200',
    free: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${styles[tone]}`}>
      {Icon && <Icon className="h-3 w-3" />}
      {children}
    </span>
  );
}
