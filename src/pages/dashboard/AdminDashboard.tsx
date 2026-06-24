import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Eye,
  Flag,
  Mail,
  MailOpen,
  MapPin,
  Pencil,
  Plus,
  Users,
  Users2,
  XCircle,
} from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatusBadge from '../../components/dashboard/StatusBadge';
import AdminOverviewCharts from '../../components/dashboard/AdminOverviewCharts';
import AdminSupportPanel from '../../components/dashboard/AdminSupportPanel';
import AdminAuthorForm from '../../components/dashboard/AdminAuthorForm';
import AdminReportsPanel from '../../components/dashboard/AdminReportsPanel';
import AdminUsersPanel from '../../components/dashboard/AdminUsersPanel';
import AdminProfilePanel from '../../components/dashboard/AdminProfilePanel';
import AdminEmailingPanel from '../../components/dashboard/AdminEmailingPanel';
import AdminAutomationPanel from '../../components/dashboard/AdminAutomationPanel';
import LeadCreateForm from '../../components/dashboard/LeadCreateForm';
import LeadEditForm from '../../components/dashboard/LeadEditForm';
import { PageLoader } from '../../components/ui/Spinner';
import SearchBar from '../../components/ui/SearchBar';
import SearchEmptyState from '../../components/ui/SearchEmptyState';
import { useToast } from '../../components/ui/Toast';
import { buildAdminNav, adminTabFromSearch, ADMIN_TAB_TITLES } from '../../lib/adminNav';
import { StaggerReveal } from '../../components/motion/ScrollReveal';
import { useCountUp, useMounted } from '../../hooks/useCountUp';
import { useAuth } from '../../context/AuthContext';
import { api, ApiError } from '../../lib/api';
import { formatLocation } from '../../lib/location';
import { filterBySearch } from '../../lib/search';
import type { AdminStats, Community, ContactMessage, LeadSummary } from '../../types';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { notify } = useToast();
  const { isSuperAdmin } = useAuth();
  const active = adminTabFromSearch(location.search, isSuperAdmin);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [leads, setLeads] = useState<LeadSummary[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [communitySearch, setCommunitySearch] = useState('');
  const [leadSearch, setLeadSearch] = useState('');
  const [messageSearch, setMessageSearch] = useState('');
  const [editingLead, setEditingLead] = useState<LeadSummary | null>(null);
  const [creatingLead, setCreatingLead] = useState(false);

  const openCommunity = (c: Community) => {
    if (c.id) navigate(`/admin/communautes/${c.id}`);
  };

  const openLead = (l: LeadSummary) => {
    navigate(`/admin/leads/${l.id}`);
  };

  const refreshAll = useCallback(async () => {
    try {
      const [s, c, l, m] = await Promise.all([
        api.adminStats(),
        api.adminCommunities(),
        api.adminLeads(),
        api.adminMessages(),
      ]);
      setStats(s.data);
      setCommunities(c.data.communities);
      setLeads(l.data.leads);
      setMessages(m.data.messages);
    } catch {
      notify('Erreur de chargement des données admin.', 'error');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const setStatus = async (c: Community, status: 'approved' | 'rejected' | 'pending') => {
    if (!c.id) return;
    try {
      await api.adminSetStatus(c.id, status);
      notify('Statut mis à jour.', 'success');
      await refreshAll();
    } catch {
      notify('Mise à jour impossible.', 'error');
    }
  };

  const markRead = async (m: ContactMessage) => {
    if (m.isRead) return;
    try {
      await api.adminMarkMessageRead(m.id);
      setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, isRead: true } : x)));
    } catch {
      /* silencieux */
    }
  };

  const handleLeadEdit = async (data: { name: string; email: string; phone?: string | null }) => {
    if (!editingLead?.id) return;
    try {
      await api.adminUpdateLead(editingLead.id, data);
      notify('Lead mis à jour.', 'success');
      setEditingLead(null);
      await refreshAll();
    } catch (err) {
      if (err instanceof ApiError) notify(err.message, 'error');
      throw err;
    }
  };

  const handleLeadCreate = async (data: { name: string; email: string; password: string; phone?: string | null }) => {
    try {
      await api.adminCreateLead(data);
      notify('Lead créé avec succès.', 'success');
      setCreatingLead(false);
      await refreshAll();
    } catch (err) {
      if (err instanceof ApiError) notify(err.message, 'error');
      throw err;
    }
  };

  const statusFilteredCommunities = filter ? communities.filter((c) => c.status === filter) : communities;

  const filteredCommunities = useMemo(
    () =>
      filterBySearch(statusFilteredCommunities, communitySearch, (c) => [
        c.name,
        c.description,
        c.shortDescription,
        c.leaderName,
        c.leaderEmail,
        c.city,
        c.country,
        c.tags,
        c.status,
      ]),
    [statusFilteredCommunities, communitySearch],
  );

  const filteredLeads = useMemo(
    () =>
      filterBySearch(leads, leadSearch, (l) => [
        l.name,
        l.email,
        l.phone,
        l.communitiesCount,
      ]),
    [leads, leadSearch],
  );

  const filteredMessages = useMemo(
    () =>
      filterBySearch(messages, messageSearch, (m) => [
        m.subject,
        m.message,
        m.name,
        m.email,
      ]),
    [messages, messageSearch],
  );

  const nav = buildAdminNav(
    {
      pendingCommunities: stats?.communities.pending,
      unreadMessages: stats?.messages.unread,
      pendingReports: stats?.reports?.pending,
    },
    { isSuperAdmin },
  );

  const sectionMeta = ADMIN_TAB_TITLES[active] ?? ADMIN_TAB_TITLES.overview;

  const goTab = (tab: string) => navigate(tab === 'overview' ? '/admin' : `/admin?tab=${tab}`);

  return (
    <DashboardLayout
      title={sectionMeta.title}
      subtitle={sectionMeta.subtitle}
      nav={nav}
      active={active}
      onNavigate={goTab}
    >
      {loading ? (
        <PageLoader label="Chargement du tableau de bord..." />
      ) : (
        <>
          {active === 'overview' && stats && (
            <div className="space-y-8">
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                <StatCard index={0} icon={Users2} label="Solutions SaaS" value={stats.communities.total} accent={STAT_ACCENTS.green} />
                <StatCard index={1} icon={Clock} label="En attente" value={stats.communities.pending} accent={STAT_ACCENTS.amber} />
                <StatCard index={2} icon={Users} label="Leads inscrits" value={stats.leads} accent={STAT_ACCENTS.sky} />
                <StatCard index={3} icon={Mail} label="Messages non lus" value={stats.messages.unread} accent={STAT_ACCENTS.red} />
                <StatCard index={4} icon={Flag} label="Signalements" value={stats.reports?.total ?? 0} accent={STAT_ACCENTS.violet} />
              </div>

              <div className="grid gap-5 lg:grid-cols-3">
                <StaggerReveal index={0} variant="gentle-up" stagger={130} maxDelay={260} className="lg:col-span-2">
                  <div className="h-full overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/60 p-6 dark:border-slate-800 dark:from-slate-900 dark:to-slate-900/40">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400">Répartition des solutions SaaS</h3>
                    <div className="mt-6">
                      <DistributionDonut
                        approved={stats.communities.approved}
                        pending={stats.communities.pending}
                        rejected={stats.communities.rejected}
                        total={stats.communities.total}
                      />
                    </div>
                  </div>
                </StaggerReveal>

                <StaggerReveal index={1} variant="gentle-up" stagger={130} maxDelay={260}>
                  <div className="h-full rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400">À traiter</h3>
                    <div className="mt-4 space-y-3">
                      <TaskRow
                        icon={Clock}
                        label="Solutions SaaS en attente"
                        value={stats.communities.pending}
                        tone={TASK_TONES.amber}
                        onClick={() => { navigate('/admin?tab=communities'); setFilter('pending'); }}
                      />
                      <TaskRow
                        icon={Mail}
                        label="Messages non lus"
                        value={stats.messages.unread}
                        tone={TASK_TONES.rose}
                        onClick={() => navigate('/admin?tab=messages')}
                      />
                      <TaskRow
                        icon={Flag}
                        label="Signalements en attente"
                        value={stats.reports?.pending ?? 0}
                        tone={TASK_TONES.violet}
                        onClick={() => navigate('/admin?tab=reports')}
                      />
                    </div>
                  </div>
                </StaggerReveal>
              </div>

              <AdminOverviewCharts communities={communities} />
            </div>
          )}

          {active === 'communities' && (
            <div>
              <div className="mb-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: '', label: 'Toutes' },
                  { id: 'pending', label: 'En attente' },
                  { id: 'approved', label: 'Approuvées' },
                  { id: 'rejected', label: 'Rejetées' },
                ].map((f) => (
                  <button
                    key={f.id}
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
                <button
                  onClick={() => navigate('/admin/communautes/nouvelle')}
                  className="inline-flex items-center gap-2 rounded-xl bg-togo-green px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-togo-green/20 transition-all hover:bg-togo-green-dark"
                >
                  <Plus className="h-4 w-4" /> Ajouter une communauté
                </button>
                </div>
                <SearchBar
                  value={communitySearch}
                  onChange={setCommunitySearch}
                  placeholder="Rechercher par nom, responsable, ville…"
                  size="sm"
                  resultCount={filteredCommunities.length}
                  totalCount={statusFilteredCommunities.length}
                />
              </div>

              {filteredCommunities.length === 0 ? (
                communitySearch.trim() ? (
                  <SearchEmptyState query={communitySearch.trim()} />
                ) : (
                  <Empty label="Aucune communauté dans cette catégorie." />
                )
              ) : (
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                  {/* En-tête (desktop) */}
                  <div className="hidden grid-cols-12 gap-3 border-b border-slate-100 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800 sm:grid">
                    <span className="col-span-5">Communauté</span>
                    <span className="col-span-3">Responsable</span>
                    <span className="col-span-2">Statut</span>
                    <span className="col-span-2 text-right">Actions</span>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredCommunities.map((c, i) => (
                      <StaggerReveal
                        key={c.id}
                        index={i}
                        variant="fade-up"
                        stagger={45}
                        maxDelay={360}
                        className="grid cursor-pointer grid-cols-12 items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        style={{ cursor: 'pointer' }}
                      >
                        {/* Communauté */}
                        <div
                          className="col-span-9 flex min-w-0 items-center gap-3 sm:col-span-5"
                          onClick={() => openCommunity(c)}
                          role="presentation"
                        >
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-togo-green/10 to-togo-yellow/10 ring-1 ring-slate-200 dark:ring-slate-700">
                            {c.logoUrl ? (
                              <img src={c.logoUrl} alt={c.name} className="h-full w-full object-cover" />
                            ) : (
                              <span className="grid h-full w-full place-items-center text-sm font-black text-togo-green">{c.name.charAt(0)}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{c.name}</p>
                            <p className="flex items-center gap-1 truncate text-xs text-slate-500 dark:text-slate-400">
                              <MapPin className="h-3 w-3 text-togo-red" /> {formatLocation(c)}
                            </p>
                            <div className="mt-1 sm:hidden"><StatusBadge status={c.status} /></div>
                          </div>
                        </div>

                        <div className="col-span-3 hidden min-w-0 sm:block" onClick={() => openCommunity(c)} role="presentation">
                          <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{c.leaderName}</p>
                          <p className="truncate text-xs text-slate-400">{c.leaderEmail}</p>
                        </div>

                        <div className="col-span-2 hidden sm:block" onClick={() => openCommunity(c)} role="presentation">
                          <StatusBadge status={c.status} />
                        </div>

                        <div className="col-span-3 flex items-center justify-end gap-1 sm:col-span-2">
                          {c.status !== 'approved' && (
                            <button
                              onClick={() => setStatus(c, 'approved')}
                              title="Approuver"
                              className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-100 text-emerald-700 transition-colors hover:bg-emerald-600 hover:text-white dark:bg-emerald-500/15 dark:text-emerald-400 dark:hover:bg-emerald-600 dark:hover:text-white"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                          )}
                          {c.status === 'pending' && (
                            <button
                              onClick={() => setStatus(c, 'rejected')}
                              title="Rejeter la soumission"
                              className="grid h-8 w-8 place-items-center rounded-lg bg-rose-100 text-rose-700 transition-colors hover:bg-rose-600 hover:text-white dark:bg-rose-500/15 dark:text-rose-400 dark:hover:bg-rose-600 dark:hover:text-white"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => openCommunity(c)}
                            title="Voir la fiche complète"
                            className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-500 transition-colors hover:bg-togo-green hover:text-white dark:bg-slate-800 dark:text-slate-300"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </StaggerReveal>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {active === 'leads' && (
            <div>
              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <SearchBar
                  value={leadSearch}
                  onChange={setLeadSearch}
                  placeholder="Rechercher un lead par nom, email, téléphone…"
                  size="sm"
                  resultCount={filteredLeads.length}
                  totalCount={leads.length}
                  className="sm:max-w-md sm:flex-1"
                />
                <button
                  onClick={() => setCreatingLead(true)}
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-togo-green px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-togo-green/20 transition-all hover:bg-togo-green-dark"
                >
                  <Plus className="h-4 w-4" /> Ajouter un lead
                </button>
              </div>

              {filteredLeads.length === 0 ? (
                leadSearch.trim() ? (
                  <SearchEmptyState query={leadSearch.trim()} />
                ) : (
                  <Empty label="Aucun lead inscrit pour le moment." />
                )
              ) : (
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                  <div className="hidden grid-cols-12 gap-3 border-b border-slate-100 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800 sm:grid">
                    <span className="col-span-3">Lead</span>
                    <span className="col-span-3">Email</span>
                    <span className="col-span-2">Téléphone</span>
                    <span className="col-span-2">Communautés</span>
                    <span className="col-span-2 text-right">Actions</span>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredLeads.map((l, i) => (
                      <StaggerReveal
                        key={l.id}
                        index={i}
                        variant="fade-up"
                        stagger={45}
                        maxDelay={360}
                        onClick={() => openLead(l)}
                        className="grid cursor-pointer grid-cols-12 items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      >
                        <div className="col-span-12 flex min-w-0 items-center gap-3 sm:col-span-3">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-togo-green text-sm font-black text-white">
                            {l.name.charAt(0).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{l.name}</p>
                            <p className="truncate text-xs text-slate-400 sm:hidden">{l.email}</p>
                          </div>
                        </div>

                        <div className="col-span-6 hidden truncate text-sm text-slate-600 dark:text-slate-300 sm:col-span-3 sm:block">
                          {l.email}
                        </div>

                        <div className="col-span-6 hidden truncate text-sm text-slate-500 dark:text-slate-400 sm:col-span-2 sm:block">
                          {l.phone || '—'}
                        </div>

                        <div className="col-span-6 sm:col-span-2">
                          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {l.communitiesCount}
                          </span>
                        </div>

                        <div className="col-span-6 flex items-center justify-end gap-1 sm:col-span-2" onClick={(e) => e.stopPropagation()}>
                          <a
                            href={`mailto:${l.email}`}
                            title="Envoyer un email"
                            className="grid h-8 w-8 place-items-center rounded-lg bg-sky-100 text-sky-700 transition-colors hover:bg-sky-600 hover:text-white dark:bg-sky-500/15 dark:text-sky-400"
                          >
                            <Mail className="h-4 w-4" />
                          </a>
                          <button
                            onClick={() => setEditingLead(l)}
                            title="Modifier"
                            className="grid h-8 w-8 place-items-center rounded-lg bg-amber-100 text-amber-700 transition-colors hover:bg-amber-500 hover:text-white dark:bg-amber-500/15 dark:text-amber-400"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openLead(l)}
                            title="Voir la fiche"
                            className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-500 transition-colors hover:bg-togo-green hover:text-white dark:bg-slate-800 dark:text-slate-300"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </StaggerReveal>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {active === 'users' && isSuperAdmin && <AdminUsersPanel />}

          {active === 'messages' && (
            <div className="space-y-4">
              {messages.length > 0 && (
                <SearchBar
                  value={messageSearch}
                  onChange={setMessageSearch}
                  placeholder="Rechercher par sujet, expéditeur, contenu…"
                  size="sm"
                  resultCount={filteredMessages.length}
                  totalCount={messages.length}
                />
              )}
              {filteredMessages.length === 0 ? (
                messageSearch.trim() ? (
                  <SearchEmptyState query={messageSearch.trim()} />
                ) : (
                  <Empty label="Aucun message reçu." />
                )
              ) : (
                filteredMessages.map((m, i) => (
                  <StaggerReveal
                    key={m.id}
                    index={i}
                    variant="fade-up"
                    stagger={50}
                    maxDelay={350}
                    onClick={() => markRead(m)}
                    className={`cursor-pointer rounded-3xl border p-5 transition-colors ${
                      m.isRead
                        ? 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                        : 'border-togo-green/30 bg-emerald-50/50 dark:border-togo-yellow/20 dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {m.isRead ? <MailOpen className="h-4 w-4 text-slate-400" /> : <Mail className="h-4 w-4 text-togo-green" />}
                        <p className="font-bold text-slate-900 dark:text-white">{m.subject}</p>
                      </div>
                      <span className="shrink-0 text-xs text-slate-400">{new Date(m.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{m.message}</p>
                    <p className="mt-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {m.name} · <a href={`mailto:${m.email}`} className="text-togo-green hover:underline dark:text-togo-yellow">{m.email}</a>
                    </p>
                  </StaggerReveal>
                ))
              )}
            </div>
          )}

          {active === 'support' && <AdminSupportPanel />}

          {active === 'emailing' && <AdminEmailingPanel />}

          {active === 'automations' && <AdminAutomationPanel />}

          {active === 'reports' && <AdminReportsPanel />}

          {active === 'author' && isSuperAdmin && (
            <div>
              <p className="mb-6 max-w-xl text-sm text-slate-500 dark:text-slate-400">
                Gérez la section fondateur affichée sur la page{' '}
                <a href="/a-propos" target="_blank" rel="noreferrer" className="font-semibold text-togo-green hover:underline dark:text-togo-yellow">
                  À propos
                </a>
                : photo, textes et liens sociaux.
              </p>
              <AdminAuthorForm />
            </div>
          )}

          {active === 'profile' && <AdminProfilePanel />}
        </>
      )}

      {/* Formulaire d'édition admin */}
      {editingLead && (
        <LeadEditForm
          initial={editingLead}
          onClose={() => setEditingLead(null)}
          onSubmit={handleLeadEdit}
        />
      )}

      {creatingLead && (
        <LeadCreateForm onClose={() => setCreatingLead(false)} onSubmit={handleLeadCreate} />
      )}
    </DashboardLayout>
  );
}

type StatAccent = { icon: string; glow: string; shadow: string };

const STAT_ACCENTS: Record<'green' | 'amber' | 'sky' | 'red' | 'violet', StatAccent> = {
  green: { icon: 'from-togo-green to-togo-green-light', glow: 'from-togo-green to-emerald-400', shadow: 'shadow-togo-green/30' },
  amber: { icon: 'from-amber-400 to-amber-500', glow: 'from-amber-300 to-amber-500', shadow: 'shadow-amber-500/30' },
  sky: { icon: 'from-sky-400 to-sky-500', glow: 'from-sky-300 to-sky-500', shadow: 'shadow-sky-500/30' },
  red: { icon: 'from-togo-red to-rose-500', glow: 'from-togo-red to-rose-400', shadow: 'shadow-togo-red/30' },
  violet: { icon: 'from-violet-400 to-violet-500', glow: 'from-violet-300 to-violet-500', shadow: 'shadow-violet-500/30' },
};

function StatCard({ icon: Icon, label, value, accent, index }: { icon: any; label: string; value: number; accent: StatAccent; index: number }) {
  const display = useCountUp(value);
  return (
    <StaggerReveal index={index} variant="gentle-up" stagger={70} maxDelay={420}>
      <div className="group relative h-full overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-slate-200/70 motion-reduce:transition-none motion-reduce:hover:translate-y-0 dark:border-slate-800 dark:bg-slate-900 dark:hover:shadow-black/40">
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${accent.glow} opacity-20 blur-2xl transition-opacity duration-300 group-hover:opacity-45`}
        />
        <span className={`relative inline-grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-lg ${accent.icon} ${accent.shadow}`}>
          <Icon className="h-6 w-6" />
        </span>
        <p className="relative mt-4 text-3xl font-black tabular-nums text-slate-900 dark:text-white">{display.toLocaleString('fr-FR')}</p>
        <p className="relative text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </StaggerReveal>
  );
}

const DONUT_SEGMENTS = [
  { key: 'approved', label: 'Approuvées', color: 'var(--color-togo-green)' },
  { key: 'pending', label: 'En attente', color: 'var(--color-togo-yellow)' },
  { key: 'rejected', label: 'Rejetées', color: 'var(--color-togo-red)' },
] as const;

function DistributionDonut({ approved, pending, rejected, total }: { approved: number; pending: number; rejected: number; total: number }) {
  const mounted = useMounted();
  const displayTotal = useCountUp(total);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;

  const values: Record<string, number> = { approved, pending, rejected };
  let cumulative = 0;

  return (
    <div className="flex flex-col items-center gap-7 sm:flex-row sm:gap-9">
      <div className="relative h-44 w-44 shrink-0">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" role="img" aria-label={`Répartition : ${approved} approuvées, ${pending} en attente, ${rejected} rejetées`}>
          <circle cx="60" cy="60" r={radius} fill="none" strokeWidth="13" className="stroke-slate-100 dark:stroke-slate-800" />
          {DONUT_SEGMENTS.map((seg) => {
            const value = values[seg.key];
            const frac = total > 0 ? value / total : 0;
            const dashOffset = -cumulative * circumference;
            cumulative += frac;
            const len = mounted ? frac * circumference : 0;
            return (
              <circle
                key={seg.key}
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth="13"
                strokeDasharray={`${len} ${circumference}`}
                strokeDashoffset={dashOffset}
                style={{ transition: 'stroke-dasharray 1.1s cubic-bezier(0.22, 1, 0.36, 1)' }}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black tabular-nums text-slate-900 dark:text-white">{displayTotal}</span>
          <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Solutions</span>
        </div>
      </div>

      <div className="w-full space-y-3.5">
        {DONUT_SEGMENTS.map((seg) => (
          <DonutLegendRow
            key={seg.key}
            label={seg.label}
            color={seg.color}
            value={values[seg.key]}
            pct={total > 0 ? Math.round((values[seg.key] / total) * 100) : 0}
            mounted={mounted}
          />
        ))}
      </div>
    </div>
  );
}

function DonutLegendRow({ label, value, color, pct, mounted }: { label: string; value: number; color: string; pct: number; mounted: boolean }) {
  const display = useCountUp(value);
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
        <span className="flex items-center gap-2 font-semibold text-slate-600 dark:text-slate-300">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
          {label}
        </span>
        <span className="flex items-baseline gap-1.5">
          <span className="font-black tabular-nums text-slate-900 dark:text-white">{display}</span>
          <span className="text-xs font-semibold text-slate-400">{pct}%</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className="h-full rounded-full"
          style={{ width: mounted ? `${pct}%` : '0%', backgroundColor: color, transition: 'width 1.1s cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </div>
    </div>
  );
}

type TaskTone = { card: string; icon: string; text: string; badge: string };

const TASK_TONES: Record<'amber' | 'rose' | 'violet', TaskTone> = {
  amber: {
    card: 'border-amber-100 bg-amber-50 hover:border-amber-200 hover:bg-amber-100/80 dark:border-amber-500/15 dark:bg-amber-500/10 dark:hover:bg-amber-500/15',
    icon: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    text: 'text-amber-700 dark:text-amber-400',
    badge: 'bg-amber-500',
  },
  rose: {
    card: 'border-rose-100 bg-rose-50 hover:border-rose-200 hover:bg-rose-100/80 dark:border-rose-500/15 dark:bg-rose-500/10 dark:hover:bg-rose-500/15',
    icon: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
    text: 'text-rose-700 dark:text-rose-400',
    badge: 'bg-togo-red',
  },
  violet: {
    card: 'border-violet-100 bg-violet-50 hover:border-violet-200 hover:bg-violet-100/80 dark:border-violet-500/15 dark:bg-violet-500/10 dark:hover:bg-violet-500/15',
    icon: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
    text: 'text-violet-700 dark:text-violet-400',
    badge: 'bg-violet-600',
  },
};

function TaskRow({ icon: Icon, label, value, tone, onClick }: { icon: any; label: string; value: number; tone: TaskTone; onClick: () => void }) {
  const display = useCountUp(value);
  return (
    <button
      onClick={onClick}
      className={`group flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-all duration-200 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${tone.card}`}
    >
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${tone.icon}`}>
        <Icon className="h-4 w-4" />
      </span>
      <span className={`flex-1 text-sm font-semibold ${tone.text}`}>{label}</span>
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums text-white ${tone.badge}`}>{display}</span>
      <ArrowRight className={`h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none ${tone.text}`} />
    </button>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Users2 className="h-12 w-12 text-slate-300" />
      <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}
