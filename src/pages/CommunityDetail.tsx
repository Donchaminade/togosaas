import { useEffect, useState } from 'react';
import type * as React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeCheck,
  ExternalLink,
  Flag,
  Globe,
  Info,
  Linkedin,
  Mail,
  MapPin,
  Play,
  Rocket,
  Target,
  Users,
  Users2,
} from 'lucide-react';
import CommunityEngagementBar from '../components/community/CommunityEngagementBar';
import CommunityShareSidebar from '../components/community/CommunityShareSidebar';
import ScrollReveal from '../components/motion/ScrollReveal';
import PricingBadge from '../components/ui/PricingBadge';
import { PageLoader } from '../components/ui/Spinner';
import { api } from '../lib/api';
import { getActiveSocialLinks } from '../lib/socialLinks';
import { externalUrl, websiteLabel } from '../lib/externalUrl';
import { formatLocation } from '../lib/location';
import { mediaUrl } from '../lib/media';
import { communityPublicPath } from '../lib/communityUrl';
import { solutionAccessUrl } from '../lib/pricing';
import type { CoLead, Community } from '../types';

type DetailTab = 'about' | 'screenshots' | 'team';

const TABS: { id: DetailTab; label: string; icon: typeof Info }[] = [
  { id: 'about', label: 'Description', icon: Info },
  { id: 'screenshots', label: 'Captures', icon: Globe },
  { id: 'team', label: 'Équipe', icon: Users },
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
    if (tabParam === 'screenshots' || tabParam === 'about' || tabParam === 'team' || tabParam === 'events' || tabParam === 'organizers') {
      const mapped = tabParam === 'events' ? 'about' : tabParam === 'organizers' ? 'team' : tabParam;
      setTab(mapped as DetailTab);
    }
    api
      .getCommunity(slugOrId)
      .then((res) => {
        const c = res.data.community;
        setCommunity(c);
        const canonical = communityPublicPath(c).replace('/solutions/', '');
        if (slugOrId !== canonical && /^\d+$/.test(slugOrId)) {
          navigate(communityPublicPath(c), { replace: true });
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slugOrId, navigate]);

  if (loading) {
    return <PageLoader label="Chargement de la solution..." />;
  }

  if (error || !community) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <p className="text-lg font-bold text-slate-700 dark:text-slate-200">Solution introuvable</p>
        <Link to="/solutions" className="mt-4 text-sm font-semibold text-togo-green hover:underline dark:text-togo-yellow">
          ← Retour au catalogue
        </Link>
      </div>
    );
  }

  const links = getActiveSocialLinks(community);
  const websiteHref = externalUrl(community.websiteUrl);
  const appHref = externalUrl(community.appUrl);
  const demoHref = externalUrl(community.demoUrl);
  const accessHref = externalUrl(solutionAccessUrl(community));
  const coLeads = community.coLeads ?? [];
  const gallery = community.gallery ?? [];

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
            to="/solutions"
            className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/30 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-black/50 sm:left-8"
          >
            <ArrowLeft className="h-4 w-4" /> Retour
          </Link>
        </div>

        <div className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
          <div className="relative mx-auto max-w-6xl px-4 pb-6 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
              <div className="-mt-14 h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-white ring-4 ring-white shadow-xl dark:bg-slate-800 dark:ring-slate-950 sm:-mt-16 sm:h-32 sm:w-32">
                {community.logoUrl ? (
                  <img src={mediaUrl(community.logoUrl)} alt={community.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="grid h-full w-full place-items-center bg-gradient-to-br from-togo-green/15 to-togo-yellow/15 text-3xl font-black text-togo-green">
                    {community.name.charAt(0)}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1 sm:pt-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                    {community.name}
                  </h1>
                  <PricingBadge
                    pricingType={community.pricingType}
                    priceAmount={community.priceAmount}
                    currency={community.currency}
                    billingPeriod={community.billingPeriod}
                    size="md"
                  />
                </div>
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
                      <Users2 className="h-4 w-4 text-togo-green" /> {community.memberCount.toLocaleString('fr-FR')} utilisateurs
                    </span>
                  )}
                </div>
                {accessHref && (
                  <a
                    href={accessHref}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-togo-green px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-togo-green/25 transition-all hover:bg-togo-green-dark dark:bg-togo-yellow dark:text-slate-900 dark:shadow-togo-yellow/20 dark:hover:bg-togo-yellow/90"
                  >
                    <Rocket className="h-4 w-4" />
                    Accéder à la solution
                    <ExternalLink className="h-3.5 w-3.5 opacity-80" />
                  </a>
                )}
                <div className="mt-4">
                  <CommunityEngagementBar community={community} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Onglets */}
      <section className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex gap-1 overflow-x-auto" aria-label="Sections de la solution">
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = tab === id;
              const shotsCount = id === 'screenshots' ? gallery.length : 0;
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
                  {shotsCount > 0 && (
                    <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
                      {shotsCount}
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
                  title={`À propos de ${community.name}`}
                  subtitle="Description complète et proposition de valeur"
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
                        Proposition de valeur
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
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">Aperçu visuel</h3>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {gallery.slice(0, 4).map((url, i) => (
                          <div key={i} className="overflow-hidden rounded-xl ring-1 ring-slate-200 dark:ring-slate-700">
                            <img src={mediaUrl(url)} alt="" className="aspect-video w-full object-cover" loading="lazy" />
                          </div>
                        ))}
                      </div>
                      {gallery.length > 4 && (
                        <button
                          type="button"
                          onClick={() => setTab('screenshots')}
                          className="mt-4 text-sm font-semibold text-togo-green hover:underline dark:text-togo-yellow"
                        >
                          Voir toutes les captures ({gallery.length})
                        </button>
                      )}
                    </div>
                  )}
                </PanelCard>
              </div>

              <aside className="space-y-4">
                {community.id != null && <CommunityShareSidebar community={{ ...community, id: community.id }} />}

                {(accessHref || demoHref || links.length > 0 || community.publicEmail || websiteHref) && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Accéder & contacter</h3>
                    <div className="mt-3 space-y-2">
                      {appHref && (
                        <a
                          href={appHref}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-800 transition-colors hover:bg-togo-green hover:text-white dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300"
                        >
                          <Rocket className="h-4 w-4 shrink-0" />
                          <span className="min-w-0 truncate">Ouvrir l&apos;application</span>
                          <ExternalLink className="ml-auto h-3.5 w-3.5 shrink-0 opacity-60" />
                        </a>
                      )}
                      {demoHref && (
                        <a
                          href={demoHref}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-3 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-sm font-semibold text-sky-800 transition-colors hover:bg-sky-600 hover:text-white dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-300"
                        >
                          <Play className="h-4 w-4 shrink-0" />
                          <span className="min-w-0 truncate">Essayer la démo</span>
                          <ExternalLink className="ml-auto h-3.5 w-3.5 shrink-0 opacity-60" />
                        </a>
                      )}
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

          {tab === 'screenshots' && (
            <PanelCard
              icon={Globe}
              title="Captures d'écran"
              subtitle="Découvrez l'interface et les fonctionnalités en images"
            >
              {gallery.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {gallery.map((url, i) => (
                    <div key={i} className="overflow-hidden rounded-2xl ring-1 ring-slate-200 dark:ring-slate-700">
                      <img
                        src={mediaUrl(url)}
                        alt={`Capture ${i + 1} — ${community.name}`}
                        className="aspect-video w-full object-cover transition-transform hover:scale-[1.02]"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  Aucune capture d&apos;écran publiée pour le moment.
                </p>
              )}
            </PanelCard>
          )}

          {tab === 'team' && (
            <PanelCard
              icon={Users}
              title={`Équipe de ${community.name}`}
              subtitle="Les fondateurs et l'équipe derrière la solution"
            >
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <OrganizerCard
                  name={community.leaderName}
                  role={community.leaderBio ? undefined : 'Fondateur'}
                  photoUrl={community.leaderPhotoUrl}
                  bio={community.leaderBio}
                  badge="Fondateur"
                  verified
                />
                {coLeads.map((c, i) => (
                  <OrganizerCard key={i} {...c} badge={c.role ?? 'Co-fondateur'} />
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
            <dt className="text-slate-500 dark:text-slate-400">Lancée en</dt>
            <dd className="font-medium text-slate-800 dark:text-slate-100">{community.foundedYear}</dd>
          </div>
        )}
        <div>
          <dt className="text-slate-500 dark:text-slate-400">Tarif</dt>
          <dd className="font-medium text-slate-800 dark:text-slate-100">
            <PricingBadge
              pricingType={community.pricingType}
              priceAmount={community.priceAmount}
              currency={community.currency}
              billingPeriod={community.billingPeriod}
            />
          </dd>
        </div>
      </dl>
    </div>
  );
}