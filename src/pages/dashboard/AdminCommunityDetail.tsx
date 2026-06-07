import { useEffect, useState } from 'react';
import type * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Sparkles,
  Target,
  Trash2,
  User2,
  Users,
  Users2,
  XCircle,
} from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatusBadge from '../../components/dashboard/StatusBadge';
import { PageLoader } from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import { buildAdminNav } from '../../lib/adminNav';
import { api } from '../../lib/api';
import { getActiveSocialLinks } from '../../lib/socialLinks';
import { externalUrl, websiteLabel } from '../../lib/externalUrl';
import { communityPublicPath } from '../../lib/communityUrl';
import { formatLocation } from '../../lib/location';
import type { CoLead, Community } from '../../types';
import CommunityEventsCalendar from '../../components/CommunityEventsCalendar';

export default function AdminCommunityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { notify } = useToast();
  const { confirmDelete } = useConfirm();
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!id) return;
    try {
      const res = await api.getCommunity(Number(id), true);
      setCommunity(res.data.community);
    } catch {
      notify('Communauté introuvable.', 'error');
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const setStatus = async (status: 'approved' | 'rejected' | 'pending') => {
    if (!community?.id) return;
    try {
      await api.adminSetStatus(community.id, status);
      notify('Statut mis à jour.', 'success');
      await load();
    } catch {
      notify('Erreur lors de la mise à jour.', 'error');
    }
  };

  const remove = async () => {
    if (!community?.id) return;
    const ok = await confirmDelete(
      `Supprimer définitivement « ${community.name} » ?\n\nCette action est irréversible.`,
    );
    if (!ok) return;
    try {
      await api.adminDeleteCommunity(community.id);
      notify('Communauté supprimée.', 'success');
      navigate('/admin');
    } catch {
      notify('Suppression impossible.', 'error');
    }
  };

  const nav = buildAdminNav();
  const goAdminTab = (tab: string) => navigate(tab === 'overview' ? '/admin' : `/admin?tab=${tab}`);

  if (loading) {
    return (
      <DashboardLayout title="Chargement..." nav={nav} active="communities" onNavigate={goAdminTab}>
        <PageLoader />
      </DashboardLayout>
    );
  }

  if (!community) return null;

  const links = getActiveSocialLinks(community);
  const websiteHref = externalUrl(community.websiteUrl);
  const coLeads = community.coLeads ?? [];
  const gallery = community.gallery ?? [];
  const events = community.events ?? [];

  return (
    <DashboardLayout
      title={community.name}
      subtitle="Fiche complète — modération & informations"
      nav={nav}
      active="communities"
      onNavigate={goAdminTab}
    >
      {/* Barre d'actions sticky */}
      <div className="sticky top-[4.5rem] z-20 -mx-4 mb-8 flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90 sm:-mx-8 sm:px-8">
        <button
          onClick={() => navigate('/admin')}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:border-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" /> Retour
        </button>
        <StatusBadge status={community.status} />
        <div className="ml-auto flex flex-wrap gap-2">
          {websiteHref && (
            <a
              href={websiteHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition-colors hover:border-togo-green hover:bg-togo-green/10 hover:text-togo-green dark:border-emerald-800 dark:text-emerald-300 dark:hover:border-togo-yellow dark:hover:text-togo-yellow"
            >
              <Globe className="h-4 w-4" /> Site web
            </a>
          )}
          {community.id && (
            <a
              href={communityPublicPath(community)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:border-togo-green hover:bg-togo-green/5 hover:text-togo-green dark:border-slate-700 dark:text-slate-300 dark:hover:border-togo-yellow dark:hover:text-togo-yellow"
            >
              <ExternalLink className="h-4 w-4" /> Page publique
            </a>
          )}
          <button
            onClick={() => navigate(`/admin/communautes/${community.id}/modifier`)}
            className="inline-flex items-center gap-2 rounded-xl bg-togo-green px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-togo-green/20 transition-all hover:bg-togo-green-dark hover:shadow-lg hover:shadow-togo-green/30"
          >
            <Pencil className="h-4 w-4" /> Modifier
          </button>
        </div>
      </div>

      {/* Bannière */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800">
        <div className="relative h-48 sm:h-56">
          {community.bannerUrl ? (
            <img src={community.bannerUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full bg-gradient-to-br from-togo-green via-togo-green-dark to-slate-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
        </div>
        <div className="relative bg-white px-6 pb-8 pt-0 dark:bg-slate-900 sm:px-10">
          <div className="-mt-14 flex flex-col gap-5 sm:-mt-16 sm:flex-row sm:items-end">
            <div className="h-28 w-28 shrink-0 overflow-hidden rounded-3xl ring-4 ring-white dark:ring-slate-900 sm:h-32 sm:w-32">
              {community.logoUrl ? (
                <img src={community.logoUrl} alt={community.name} className="h-full w-full object-cover" />
              ) : (
                <span className="grid h-full w-full place-items-center bg-gradient-to-br from-togo-green/15 to-togo-yellow/15 text-3xl font-black text-togo-green">
                  {community.name.charAt(0)}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1 pb-1">
              <h1 className="text-2xl font-black text-slate-900 sm:text-3xl dark:text-white">{community.name}</h1>
              {community.shortDescription && (
                <p className="mt-2 text-slate-600 dark:text-slate-300">{community.shortDescription}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-togo-red" />{formatLocation(community)}</span>
                {community.foundedYear && <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />Depuis {community.foundedYear}</span>}
                {community.memberCount != null && community.memberCount > 0 && (
                  <span className="flex items-center gap-1.5"><Users2 className="h-4 w-4" />{community.memberCount} membres</span>
                )}
              </div>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {community.tags.map((t) => (
              <span key={t} className="rounded-full bg-togo-green/10 px-3 py-1 text-xs font-bold text-togo-green dark:bg-togo-yellow/10 dark:text-togo-yellow">{t}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-3">
        {/* Colonne principale */}
        <div className="space-y-10 lg:col-span-2">
          <Block icon={Sparkles} title="Description">
            <p className="leading-relaxed text-slate-600 dark:text-slate-300">{community.description}</p>
          </Block>
          {community.mission && (
            <Block icon={Target} title="Mission">
              <p className="leading-relaxed text-slate-600 dark:text-slate-300">{community.mission}</p>
            </Block>
          )}
          {community.meetingInfo && (
            <Block icon={Calendar} title="Rencontres">
              <p className="leading-relaxed text-slate-600 dark:text-slate-300">{community.meetingInfo}</p>
            </Block>
          )}
          <Block icon={Users} title="Équipe">
            <div className="grid gap-5 sm:grid-cols-2">
              <TeamCard name={community.leaderName} role="Lead / Responsable" photoUrl={community.leaderPhotoUrl} bio={community.leaderBio} isLead />
              {coLeads.map((c, i) => <TeamCard key={i} {...c} />)}
            </div>
          </Block>
          {gallery.length > 0 && (
            <Block icon={Sparkles} title="Galerie">
              <div className="grid gap-4 sm:grid-cols-2">
                {gallery.map((url, i) => (
                  <img key={i} src={url} alt="" className="aspect-video w-full rounded-2xl object-cover ring-1 ring-slate-200 dark:ring-slate-800" />
                ))}
              </div>
            </Block>
          )}
          {events.length > 0 && (
            <Block icon={Calendar} title="Calendrier événementiel">
              <CommunityEventsCalendar events={events} />
            </Block>
          )}
        </div>

        {/* Sidebar admin */}
        <aside className="space-y-6">
          {/* Modération */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Modération</h3>
            <div className="mt-5 space-y-3">
              {community.status !== 'approved' && (
                <ActionBtn
                  onClick={() => setStatus('approved')}
                  icon={CheckCircle2}
                  label="Approuver"
                  className="border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-600 hover:bg-emerald-600 hover:text-white dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300 dark:hover:bg-emerald-600 dark:hover:text-white"
                />
              )}
              {community.status !== 'pending' && (
                <ActionBtn
                  onClick={() => setStatus('pending')}
                  icon={Clock}
                  label="Remettre en attente"
                  className="border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-500 hover:bg-amber-500 hover:text-white dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300 dark:hover:bg-amber-600 dark:hover:text-white"
                />
              )}
              {community.status === 'pending' && (
                <ActionBtn
                  onClick={() => setStatus('rejected')}
                  icon={XCircle}
                  label="Rejeter la soumission"
                  className="border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-600 hover:bg-rose-600 hover:text-white dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300 dark:hover:bg-rose-600 dark:hover:text-white"
                />
              )}
              <ActionBtn
                onClick={remove}
                icon={Trash2}
                label="Supprimer définitivement"
                className="border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-600 hover:bg-rose-600 hover:text-white dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300 dark:hover:bg-rose-600 dark:hover:text-white"
              />
            </div>
          </div>

          {/* Contact privé */}
          <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-6 dark:border-slate-800 dark:bg-slate-900/50">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Contact responsable (privé)</h3>
            <dl className="mt-5 space-y-4 text-sm">
              <InfoRow icon={User2} label="Nom" value={community.leaderName} />
              {community.leaderEmail && <InfoRow icon={Mail} label="Email" value={community.leaderEmail} href={`mailto:${community.leaderEmail}`} />}
              {community.leaderPhone && <InfoRow icon={Phone} label="Téléphone" value={community.leaderPhone} />}
              {community.publicEmail && <InfoRow icon={Mail} label="Email public" value={community.publicEmail} href={`mailto:${community.publicEmail}`} />}
            </dl>
          </div>

          {(community.ownerName || community.ownerEmail) && (
            <div className="rounded-3xl border border-slate-200 p-6 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Compte lead</h3>
              <dl className="mt-5 space-y-4 text-sm">
                {community.ownerName && <InfoRow icon={User2} label="Nom" value={community.ownerName} />}
                {community.ownerEmail && <InfoRow icon={Mail} label="Email" value={community.ownerEmail} href={`mailto:${community.ownerEmail}`} />}
              </dl>
            </div>
          )}

          {/* Réseaux */}
          {(links.length > 0 || websiteHref) && (
            <div className="rounded-3xl border border-slate-200 p-6 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Liens & réseaux</h3>
              <div className="mt-5 space-y-2.5">
                {websiteHref && (
                  <a
                    href={websiteHref}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 transition-all duration-200 hover:border-togo-green hover:bg-togo-green hover:text-white dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:border-togo-green dark:hover:bg-togo-green dark:hover:text-white"
                  >
                    <Globe className="h-5 w-5" /> {websiteLabel(community.websiteUrl!)}
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
              </div>
            </div>
          )}

          <p className="text-xs text-slate-400">
            Créée le {community.createdAt ? new Date(community.createdAt).toLocaleDateString('fr-FR') : '—'}
            {community.updatedAt ? ` · MàJ ${new Date(community.updatedAt).toLocaleDateString('fr-FR')}` : ''}
          </p>
        </aside>
      </div>
    </DashboardLayout>
  );
}

function Block({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="flex items-center gap-3 text-lg font-black text-slate-900 dark:text-white">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-togo-green/10 text-togo-green dark:bg-togo-yellow/10 dark:text-togo-yellow">
          <Icon className="h-5 w-5" />
        </span>
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function TeamCard({ name, role, photoUrl, bio, linkedinUrl, isLead }: CoLead & { isLead?: boolean }) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        isLead
          ? 'border-togo-green/30 bg-togo-green/5 dark:border-togo-yellow/20 dark:bg-togo-yellow/5'
          : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl ring-2 ring-white dark:ring-slate-900">
          {photoUrl ? (
            <img src={photoUrl} alt={name} className="h-full w-full object-cover" />
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
          LinkedIn
        </a>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, href }: { icon: any; label: string; value: string; href?: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-1 flex items-center gap-2 font-medium text-slate-800 dark:text-slate-100">
        <Icon className="h-4 w-4 text-slate-400" />
        {href ? (
          <a href={href} className="text-togo-green transition-colors hover:text-togo-green-dark hover:underline dark:text-togo-yellow dark:hover:text-yellow-300">{value}</a>
        ) : value}
      </dd>
    </div>
  );
}

function ActionBtn({ icon: Icon, label, onClick, disabled, className }: { icon: any; label: string; onClick: () => void; disabled?: boolean; className: string }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition-all duration-200 ${className}`}
    >
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}
