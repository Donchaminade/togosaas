import { useEffect, useState } from 'react';
import type * as React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeCheck,
  Calendar,
  ExternalLink,
  Flag,
  Globe,
  Info,
  Linkedin,
  Mail,
  MapPin,
  Target,
  Users,
  Users2,
} from 'lucide-react';
import CommunityEngagementBar from '../components/community/CommunityEngagementBar';
import CommunityShareSidebar from '../components/community/CommunityShareSidebar';
import CommunityEventsExplorer from '../components/community/CommunityEventsExplorer';
import ScrollReveal from '../components/motion/ScrollReveal';
import { PageLoader } from '../components/ui/Spinner';
import { api } from '../lib/api';
import { getActiveSocialLinks } from '../lib/socialLinks';
import { externalUrl, websiteLabel } from '../lib/externalUrl';
import { formatLocation } from '../lib/location';
import { mediaUrl } from '../lib/media';
import { communityPublicPath } from '../lib/communityUrl';
import type { CoLead, Community } from '../types';

type DetailTab = 'about' | 'events' | 'organizers';

const TABS: { id: DetailTab; label: string; icon: typeof Info }[] = [
  { id: 'about', label: 'À propos', icon: Info },
  { id: 'events', label: 'Événements', icon: Calendar },
  { id: 'organizers', label: 'Organisateurs', icon: Users },
];

export default function CommunityDetail() {
  const { id: slugOrId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<DetailTab>('about');

  useEffect(() => {
    if (!slugOrId) return;
    const tabParam = new URLSearchParams(window.location.search).get('tab');
    if (tabParam === 'events' || tabParam === 'about' || tabParam === 'organizers') {
      setTab(tabParam);
    }
    api
      .getCommunity(slugOrId)
      .then((res) => {
        const c = res.data.community;
        setCommunity(c);
        const canonical = communityPublicPath(c).replace('/communautes/', '');
        if (slugOrId !== canonical && /^\d+$/.test(slugOrId)) {
          navigate(communityPublicPath(c), { replace: true });
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slugOrId, navigate]);

  if (loading) {
    return <PageLoader label="Chargement de la communauté..." />;
  }

  if (error || !community) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <p className="text-lg font-bold text-slate-700 dark:text-slate-200">Communauté introuvable</p>
        <Link to="/communautes" className="mt-4 text-sm font-semibold text-togo-green hover:underline dark:text-togo-yellow">
          ← Retour à l'annuaire
        </Link>
      </div>
    );
  }

  const links = getActiveSocialLinks(community);
  const websiteHref = externalUrl(community.websiteUrl);
  const coLeads = community.coLeads ?? [];
  const gallery = community.gallery ?? [];
  const events = community.events ?? [];

  return (
    <>
      {/* Bannière hero */}
      <section className="relative">
        <div className="relative h-48 overflow-hidden sm:h-64 md:h-72">
          {community.bannerUrl ? (
            <img src={mediaUrl(community.bannerUrl)} alt="" className="h-full w-full object-cover motion-banner-zoom" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-togo-green via-togo-green-dark to-slate-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />

          <Link
            to="/communautes"
            className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/30 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-black/50 sm:left-8"
          >
            <ArrowLeft className="h-4 w-4" /> Retour
          </Link>
        </div>

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="-mt-14 flex flex-col gap-4 sm:-mt-16 sm:flex-row sm:items-end sm:gap-6">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-white ring-4 ring-white shadow-xl dark:bg-slate-800 dark:ring-slate-950 sm:h-32 sm:w-32">
              {community.logoUrl ? (
                <img src={mediaUrl(community.logoUrl)} alt={community.name} className="h-full w-full object-cover" />
              ) : (
                <span className="grid h-full w-full place-items-center bg-gradient-to-br from-togo-green/15 to-togo-yellow/15 text-3xl font-black text-togo-green">
                  {community.name.charAt(0)}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1 pb-2">
              <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                {community.name}
              </h1>
              {community.shortDescription && (
                <p className="mt-1 max-w-2xl text-sm text-slate-600 sm:text-base dark:text-slate-300">
                  {community.shortDescription}
                </p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-togo-red" /> {formatLocation(community)}
                </span>
                {community.memberCount != null && community.memberCount > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Users2 className="h-4 w-4 text-togo-green" /> {community.memberCount.toLocaleString('fr-FR')} membres
                  </span>
                )}
              </div>
              <div className="mt-4">
                <CommunityEngagementBar community={community} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Onglets */}
      <section className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex gap-1 overflow-x-auto" aria-label="Sections de la communauté">
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = tab === id;
              const eventsCount = id === 'events' ? events.length : 0;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-4 text-sm font-semibold transition-colors ${
                    active
                      ? 'border-sky-600 text-sky-700 dark:border-sky-400 dark:text-sky-300'
                      : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  {eventsCount > 0 && (
                    <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
                      {eventsCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </section>

      <section className="bg-slate-50 pb-24 pt-8 dark:bg-slate-900/40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {tab === 'about' && (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <PanelCard
                  icon={Globe}
                  title={`À propos ${community.name}`}
                  subtitle="Découvrez la mission et l'identité de cette communauté"
                >
                  <div className="space-y-5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {community.description.split('\n').map((p, i) => (
                      p.trim() ? <p key={i}>{p}</p> : null
                    ))}
                  </div>

                  {community.mission && (
                    <div className="mt-8 border-t border-slate-100 pt-6 dark:border-slate-800">
                      <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                        <Target className="h-4 w-4 text-togo-green dark:text-togo-yellow" />
                        Notre mission
                      </h3>
                      <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                        {community.mission}
                      </p>
                    </div>
                  )}

                  {community.meetingInfo && (
                    <div className="mt-8 rounded-xl bg-sky-50 p-4 dark:bg-sky-500/10">
                      <p className="text-xs font-bold uppercase tracking-wide text-sky-700 dark:text-sky-300">
                        Rencontres & événements
                      </p>
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{community.meetingInfo}</p>
                    </div>
                  )}

                  {gallery.length > 0 && (
                    <div className="mt-8 border-t border-slate-100 pt-6 dark:border-slate-800">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">Galerie</h3>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {gallery.map((url, i) => (
                          <div key={i} className="overflow-hidden rounded-xl ring-1 ring-slate-200 dark:ring-slate-700">
                            <img src={mediaUrl(url)} alt="" className="aspect-video w-full object-cover" loading="lazy" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </PanelCard>
              </div>

              <aside className="space-y-4">
                {community.id != null && <CommunityShareSidebar community={{ ...community, id: community.id }} />}

                {(links.length > 0 || community.publicEmail || websiteHref) && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Rejoindre / suivre</h3>
                    <div className="mt-3 space-y-2">
                      {websiteHref && (
                        <a
                          href={websiteHref}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-800 transition-colors hover:bg-togo-green hover:text-white dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300"
                        >
                          <Globe className="h-4 w-4 shrink-0" />
                          <span className="min-w-0 truncate">{websiteLabel(community.websiteUrl!)}</span>
                          <ExternalLink className="ml-auto h-3.5 w-3.5 shrink-0 opacity-60" />
                        </a>
                      )}
                      {links.map((s) => (
                        <a
                          key={s.key}
                          href={community[s.key] as string}
                          target="_blank"
                          rel="noreferrer"
                          className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${s.btn}`}
                        >
                          <s.icon className="h-4 w-4 shrink-0" /> {s.label}
                        </a>
                      ))}
                      {community.publicEmail && (
                        <a
                          href={`mailto:${community.publicEmail}`}
                          className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-togo-green hover:text-white dark:border-slate-700 dark:text-slate-200"
                        >
                          <Mail className="h-4 w-4 shrink-0" /> {community.publicEmail}
                        </a>
                      )}
                    </div>
                  </div>
                )}

                <InfoCard community={community} />

                <Link
                  to={`${communityPublicPath(community)}/signaler`}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 py-3 text-xs font-semibold text-slate-400 transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:hover:border-rose-500/40 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                >
                  <Flag className="h-3.5 w-3.5" />
                  Signaler un abus (anonyme)
                </Link>
              </aside>
            </div>
          )}

          {tab === 'events' && (
            <PanelCard
              icon={Calendar}
              title="Événements du Chapitre"
              subtitle="Les rendez-vous et activités de l'année"
            >
              {events.length > 0 ? (
                <CommunityEventsExplorer community={community} events={events} />
              ) : (
                <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  Aucun événement publié pour le moment.
                </p>
              )}
            </PanelCard>
          )}

          {tab === 'organizers' && (
            <PanelCard
              icon={Users}
              title={`Organisateurs de ${community.name}`}
              subtitle="Rencontrez l'équipe derrière cette communauté"
            >
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <OrganizerCard
                  name={community.leaderName}
                  role={community.leaderBio ? undefined : 'Responsable'}
                  photoUrl={community.leaderPhotoUrl}
                  bio={community.leaderBio}
                  badge="Responsable"
                  verified
                />
                {coLeads.map((c, i) => (
                  <OrganizerCard key={i} {...c} badge="Co-lead" />
                ))}
              </div>
            </PanelCard>
          )}
        </div>
      </section>
    </>
  );
}

function PanelCard({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: typeof Info;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <ScrollReveal variant="fade-up">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
          </div>
        </div>
        {children}
      </div>
    </ScrollReveal>
  );
}

function OrganizerCard({
  name,
  role,
  photoUrl,
  bio,
  linkedinUrl,
  badge,
  verified,
}: CoLead & { badge: string; verified?: boolean }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-slate-50/80 p-6 text-center dark:border-slate-700 dark:bg-slate-800/50">
      <div className="h-24 w-24 overflow-hidden rounded-full ring-4 ring-white shadow-md dark:ring-slate-700">
        {photoUrl ? (
          <img src={mediaUrl(photoUrl)} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span className="grid h-full w-full place-items-center bg-gradient-to-br from-togo-green to-togo-green-dark text-2xl font-black text-white">
            {name.charAt(0)}
          </span>
        )}
      </div>

      <div className="mt-4 flex items-center justify-center gap-1.5">
        <p className="text-base font-bold text-slate-900 dark:text-white">{name}</p>
        {verified && <BadgeCheck className="h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />}
      </div>

      {(role || bio) && (
        <p className="mt-2 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{bio || role}</p>
      )}

      <span className="mt-4 rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-600">
        {badge}
      </span>

      {linkedinUrl && (
        <a
          href={linkedinUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-sky-600 dark:hover:text-sky-400"
        >
          <Linkedin className="h-3.5 w-3.5" /> LinkedIn
        </a>
      )}
    </div>
  );
}

function InfoCard({ community }: { community: Community }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-sm font-bold text-slate-900 dark:text-white">Informations</h3>
      <dl className="mt-3 space-y-2 text-sm">
        <div>
          <dt className="text-slate-500 dark:text-slate-400">Pays</dt>
          <dd className="font-medium text-slate-800 dark:text-slate-100">{community.country}</dd>
        </div>
        {community.city && (
          <div>
            <dt className="text-slate-500 dark:text-slate-400">Ville</dt>
            <dd className="font-medium text-slate-800 dark:text-slate-100">{community.city}</dd>
          </div>
        )}
        {community.foundedYear && (
          <div>
            <dt className="text-slate-500 dark:text-slate-400">Fondée en</dt>
            <dd className="font-medium text-slate-800 dark:text-slate-100">{community.foundedYear}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}