import { useEffect, useState } from 'react';
import type * as React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  Flag,
  Globe,
  Linkedin,
  Mail,
  MapPin,
  Sparkles,
  Target,
  Users,
  Users2,
} from 'lucide-react';
import ShareCommunityButton from '../components/ui/ShareCommunityButton';
import Wave from '../components/ui/Wave';
import CommunityEventsCalendar from '../components/CommunityEventsCalendar';
import ScrollReveal, { type RevealVariant } from '../components/motion/ScrollReveal';
import { PageLoader } from '../components/ui/Spinner';
import { api } from '../lib/api';
import { getActiveSocialLinks } from '../lib/socialLinks';
import { externalUrl, websiteLabel } from '../lib/externalUrl';
import { formatLocation } from '../lib/location';
import { mediaUrl } from '../lib/media';
import { communityPublicPath } from '../lib/communityUrl';
import type { CoLead, Community } from '../types';

export default function CommunityDetail() {
  const { id: slugOrId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slugOrId) return;
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
        <div className="relative h-56 overflow-hidden sm:h-72 md:h-80">
          {community.bannerUrl ? (
            <img
              src={mediaUrl(community.bannerUrl)}
              alt=""
              className="h-full w-full object-cover motion-banner-zoom"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-togo-green via-togo-green-dark to-slate-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
          <div className="pointer-events-none absolute inset-0 text-white/10 bg-dots" />

          <Link
            to="/communautes"
            className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/30 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-black/50 sm:left-8"
          >
            <ArrowLeft className="h-4 w-4" /> Retour
          </Link>
        </div>

        {/* Identité (chevauche la bannière) */}
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="-mt-16 flex flex-col gap-5 sm:-mt-20 sm:flex-row sm:items-end sm:gap-6">
            <ScrollReveal variant="gentle-in" duration={950}>
            <div className="h-28 w-28 shrink-0 overflow-hidden rounded-3xl bg-white ring-4 ring-white shadow-xl dark:bg-slate-800 dark:ring-slate-950 sm:h-36 sm:w-36">
              {community.logoUrl ? (
                <img src={mediaUrl(community.logoUrl)} alt={community.name} className="h-full w-full object-cover" />
              ) : (
                <span className="grid h-full w-full place-items-center bg-gradient-to-br from-togo-green/15 to-togo-yellow/15 text-4xl font-black text-togo-green">
                  {community.name.charAt(0)}
                </span>
              )}
            </div>
            </ScrollReveal>
            <ScrollReveal variant="fade-up" delay={150}>
            <div className="min-w-0 flex-1 pb-2">
              <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                {community.name}
              </h1>
              {community.shortDescription && (
                <p className="mt-2 max-w-2xl text-base text-slate-600 dark:text-slate-300">
                  {community.shortDescription}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-togo-red" /> {formatLocation(community)}
                </span>
                {community.foundedYear && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-togo-green" /> Depuis {community.foundedYear}
                  </span>
                )}
                {community.memberCount != null && community.memberCount > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Users2 className="h-4 w-4 text-togo-green" /> {community.memberCount.toLocaleString('fr-FR')} membres
                  </span>
                )}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {community.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-togo-green/10 px-3 py-1 text-xs font-bold text-togo-green dark:bg-togo-yellow/10 dark:text-togo-yellow"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <ShareCommunityButton community={community} />
                {websiteHref && (
                  <a
                    href={websiteHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-togo-green px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-togo-green/25 transition-all hover:bg-togo-green-dark hover:shadow-lg dark:bg-togo-yellow dark:text-slate-900 dark:shadow-togo-yellow/20 dark:hover:bg-yellow-400"
                  >
                    <Globe className="h-4 w-4" />
                    Visiter le site web
                    <ExternalLink className="h-3.5 w-3.5 opacity-80" />
                  </a>
                )}
              </div>
            </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <section className="relative bg-white pb-24 pt-10 dark:bg-slate-950">
        <div className="mx-auto grid max-w-5xl gap-10 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
          {/* Colonne principale */}
          <div className="space-y-10 lg:col-span-2">
            {/* À propos */}
            <Block icon={Sparkles} title="À propos" variant="fade-up">
              <p className="leading-relaxed text-slate-600 dark:text-slate-300">{community.description}</p>
            </Block>

            {/* Mission */}
            {community.mission && (
              <Block icon={Target} title="Notre mission" variant="gentle-up" delay={80}>
                <p className="leading-relaxed text-slate-600 dark:text-slate-300">{community.mission}</p>
              </Block>
            )}

            {/* Équipe */}
            <Block icon={Users} title="L'équipe" variant="fade-up" delay={120}>
              <div className="grid gap-4 sm:grid-cols-2">
                <TeamCard
                  name={community.leaderName}
                  role="Lead / Responsable"
                  photoUrl={community.leaderPhotoUrl}
                  bio={community.leaderBio}
                  isLead
                />
                {coLeads.map((c, i) => (
                  <TeamCard key={i} {...c} />
                ))}
              </div>
            </Block>

            {/* Galerie */}
            {gallery.length > 0 && (
              <Block icon={Sparkles} title="Galerie" variant="zoom-out" delay={100}>
                <div className="grid gap-3 sm:grid-cols-2">
                  {gallery.map((url, i) => (
                    <div key={i} className="motion-hover-zoom overflow-hidden rounded-2xl ring-1 ring-slate-200 dark:ring-slate-800">
                      <img src={mediaUrl(url)} alt="" className="aspect-video w-full object-cover transition-transform hover:scale-105" loading="lazy" />
                    </div>
                  ))}
                </div>
              </Block>
            )}

            {events.length > 0 && (
              <Block icon={Calendar} title="Calendrier événementiel" variant="fade-up" delay={140}>
                <CommunityEventsCalendar events={events} />
              </Block>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {(links.length > 0 || community.publicEmail || websiteHref) && (
              <ScrollReveal variant="gentle-up" delay={100}>
              <div className="rounded-3xl border border-slate-200 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-900">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Rejoindre / suivre</h3>
                <div className="mt-4 space-y-2">
                  {websiteHref && (
                    <a
                      href={websiteHref}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 transition-all duration-200 hover:border-togo-green hover:bg-togo-green hover:text-white dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:border-togo-green dark:hover:bg-togo-green dark:hover:text-white"
                    >
                      <Globe className="h-5 w-5" />
                      <span className="min-w-0 truncate">{websiteLabel(community.websiteUrl!)}</span>
                      <ExternalLink className="ml-auto h-4 w-4 shrink-0 opacity-60" />
                    </a>
                  )}
                  {links.map((s) => (
                    <a
                      key={s.key}
                      href={community[s.key] as string}
                      target="_blank"
                      rel="noreferrer"
                      className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold transition-all duration-200 ${s.btn}`}
                    >
                      <s.icon className="h-5 w-5" /> {s.label}
                    </a>
                  ))}
                  {community.publicEmail && (
                    <a
                      href={`mailto:${community.publicEmail}`}
                      className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-togo-green hover:text-white dark:bg-slate-800 dark:text-slate-200"
                    >
                      <Mail className="h-5 w-5" /> {community.publicEmail}
                    </a>
                  )}
                </div>
              </div>
              </ScrollReveal>
            )}

            {community.meetingInfo && (
              <ScrollReveal variant="gentle-up" delay={180}>
              <div className="rounded-3xl border border-togo-green/20 bg-togo-green/5 p-6 dark:border-togo-yellow/20 dark:bg-togo-yellow/5">
                <h3 className="flex items-center gap-2 text-sm font-bold text-togo-green dark:text-togo-yellow">
                  <Calendar className="h-4 w-4" /> Rencontres & événements
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {community.meetingInfo}
                </p>
              </div>
              </ScrollReveal>
            )}

            <ScrollReveal variant="gentle-up" delay={240}>
            <div className="rounded-3xl border border-slate-200 p-6 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Informations</h3>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="font-semibold text-slate-500 dark:text-slate-400">Pays</dt>
                  <dd className="text-slate-800 dark:text-slate-100">{community.country}</dd>
                </div>
                {community.city && (
                  <div>
                    <dt className="font-semibold text-slate-500 dark:text-slate-400">Ville</dt>
                    <dd className="text-slate-800 dark:text-slate-100">{community.city}</dd>
                  </div>
                )}
                {community.foundedYear && (
                  <div>
                    <dt className="font-semibold text-slate-500 dark:text-slate-400">Fondée en</dt>
                    <dd className="text-slate-800 dark:text-slate-100">{community.foundedYear}</dd>
                  </div>
                )}
                {community.createdAt && (
                  <div>
                    <dt className="font-semibold text-slate-500 dark:text-slate-400">Référencée sur T.C.H</dt>
                    <dd className="text-slate-800 dark:text-slate-100">
                      {new Date(community.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
            </ScrollReveal>

            <Link
              to={`${communityPublicPath(community)}/signaler`}
              className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 py-3 text-xs font-semibold text-slate-400 transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:hover:border-rose-500/40 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
            >
              <Flag className="h-3.5 w-3.5" />
              Membre — signaler un abus (anonyme)
            </Link>
          </aside>
        </div>

        <Wave colorClassName="text-slate-50 dark:text-slate-950" />
      </section>
    </>
  );
}

function Block({
  icon: Icon,
  title,
  children,
  variant = 'fade-up',
  delay = 0,
}: {
  icon: any;
  title: string;
  children: React.ReactNode;
  variant?: RevealVariant;
  delay?: number;
}) {
  return (
    <ScrollReveal variant={variant} delay={delay}>
      <div>
        <h2 className="flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-togo-green/10 text-togo-green dark:bg-togo-yellow/10 dark:text-togo-yellow">
            <Icon className="h-5 w-5" />
          </span>
          {title}
        </h2>
        <div className="mt-4">{children}</div>
      </div>
    </ScrollReveal>
  );
}

function TeamCard({
  name,
  role,
  photoUrl,
  bio,
  linkedinUrl,
  isLead,
}: CoLead & { isLead?: boolean }) {
  return (
    <div
      className={`rounded-2xl border bg-white p-5 dark:bg-slate-900 ${
        isLead
          ? 'border-togo-green/30 ring-1 ring-togo-green/20 dark:border-togo-yellow/20'
          : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl ring-2 ring-slate-100 dark:ring-slate-800">
          {photoUrl ? (
            <img src={mediaUrl(photoUrl)} alt={name} className="h-full w-full object-cover" />
          ) : (
            <span className="grid h-full w-full place-items-center bg-gradient-to-br from-togo-green to-togo-green-dark text-2xl font-black text-white">
              {name.charAt(0)}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold leading-snug text-slate-900 dark:text-white">{name}</p>
          {role && (
            <p className="mt-1 text-xs font-bold uppercase tracking-wide text-togo-green dark:text-togo-yellow">
              {role}
            </p>
          )}
        </div>
      </div>

      {bio && (
        <p className="mt-4 border-t border-slate-100 pt-4 text-sm leading-relaxed text-slate-600 dark:border-slate-800 dark:text-slate-300">
          {bio}
        </p>
      )}

      {linkedinUrl && (
        <a
          href={linkedinUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-togo-green dark:hover:text-togo-yellow"
        >
          <Linkedin className="h-3.5 w-3.5" /> LinkedIn
        </a>
      )}
    </div>
  );
}
