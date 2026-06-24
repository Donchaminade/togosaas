import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  MessageCircle,
  Plus,
  Users2,
} from 'lucide-react';
import { CommunitiesTable } from '../../components/dashboard/CommunitiesTable';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import LeadAdminChat from '../../components/dashboard/LeadAdminChat';
import LeadCoLeadsPanel from '../../components/dashboard/LeadCoLeadsPanel';
import LeadEventsPanel from '../../components/dashboard/LeadEventsPanel';
import LeadProfilePanel from '../../components/dashboard/LeadProfilePanel';
import { PageLoader } from '../../components/ui/Spinner';
import SearchBar from '../../components/ui/SearchBar';
import SearchEmptyState from '../../components/ui/SearchEmptyState';
import { useToast } from '../../components/ui/Toast';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { buildLeadNav, leadSectionFromPath, LEAD_SECTION_TITLES } from '../../lib/leadNav';
import { filterBySearch } from '../../lib/search';
import type { Community } from '../../types';

export default function LeadDashboard() {
  const { user } = useAuth();
  const { notify } = useToast();
  const { confirmDelete } = useConfirm();
  const location = useLocation();
  const navigate = useNavigate();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [supportUnread, setSupportUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const active = leadSectionFromPath(location.pathname);

  const load = async () => {
    try {
      const [commRes, unreadRes] = await Promise.all([
        api.myCommunities(),
        api.leadSupportUnread().catch(() => ({ data: { unread: 0 } })),
      ]);
      setCommunities(commRes.data.communities);
      setSupportUnread(unreadRes.data.unread);
    } catch {
      notify('Impossible de charger vos solutions SaaS.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const owned = communities.filter((c) => c.membershipRole !== 'co_lead');
    const coLeadsTotal = owned.reduce((n, c) => n + (c.coLeads?.length ?? 0), 0);
    return {
      total: communities.length,
      approved: communities.filter((c) => c.status === 'approved').length,
      pending: communities.filter((c) => c.status === 'pending').length,
      owned: owned.length,
      coLeadsTotal,
    };
  }, [communities]);

  const nav = buildLeadNav({
    communitiesTotal: stats.total || undefined,
    pending: stats.pending || undefined,
    coLeadsTotal: stats.coLeadsTotal || undefined,
    supportUnread: supportUnread || undefined,
  });

  const sectionMeta = LEAD_SECTION_TITLES[active] ?? LEAD_SECTION_TITLES.overview;
  const subtitle = active === 'overview'
    ? `Bonjour ${user?.name?.split(' ')[0] ?? ''}, gérez vos solutions SaaS`
    : sectionMeta.subtitle;

  const handleDelete = async (c: Community) => {
    if (!c.id || c.membershipRole === 'co_lead') return;
    const ok = await confirmDelete(`Supprimer définitivement « ${c.name} » ?\n\nCette action est irréversible.`);
    if (!ok) return;
    try {
      await api.deleteCommunity(c.id);
      notify('Solution SaaS supprimée.', 'success');
      await load();
    } catch {
      notify('Suppression impossible.', 'error');
    }
  };

  return (
    <DashboardLayout
      title={sectionMeta.title}
      subtitle={subtitle}
      nav={nav}
      active={active}
      onNavigate={(id) => {
        if (id === 'overview') navigate('/espace-lead');
      }}
    >
      {loading ? (
        <PageLoader label="Chargement..." />
      ) : (
        <>
          {active === 'overview' && (
            <div className="min-w-0 space-y-8">
              <div className="grid min-w-0 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { icon: Users2, label: 'Solutions SaaS', value: stats.total, color: 'text-togo-green bg-togo-green/10' },
                  { icon: CheckCircle2, label: 'Approuvées', value: stats.approved, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-500/15' },
                  { icon: Clock, label: 'En attente', value: stats.pending, color: 'text-amber-600 bg-amber-100 dark:bg-amber-500/15' },
                  { icon: MessageCircle, label: 'Messages admin', value: supportUnread, color: 'text-sky-600 bg-sky-100 dark:bg-sky-500/15' },
                ].map((card) => (
                  <StatCard key={card.label} icon={card.icon} label={card.label} value={card.value} color={card.color} />
                ))}
              </div>

              <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { to: '/espace-lead/communautes/nouvelle', label: 'Nouvelle solution SaaS', desc: 'Soumettre une fiche', accent: true },
                  { to: '/espace-lead/co-leads', label: 'Gérer les co-leads', desc: `${stats.coLeadsTotal} membre(s)` },
                  { to: '/espace-lead/messages', label: 'Contacter l\'admin', desc: supportUnread ? `${supportUnread} non lu(s)` : 'Support Togosaas' },
                  { to: '/espace-lead/evenements', label: 'Calendrier', desc: 'Tous vos événements' },
                  { to: '/espace-lead/profil', label: 'Mon profil', desc: 'Nom, téléphone' },
                  { to: '/espace-lead/communautes', label: 'Mes solutions SaaS', desc: `${stats.total} fiche(s)` },
                ].map((link) => (
                  <QuickLink key={link.to} to={link.to} label={link.label} desc={link.desc} accent={link.accent} />
                ))}
              </div>

              {stats.pending > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 dark:border-amber-500/30 dark:bg-amber-500/10">
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                    {stats.pending} solution SaaS{stats.pending > 1 ? 's' : ''} en attente de validation.
                  </p>
                  <Link to="/espace-lead/messages" className="mt-1 inline-block text-xs font-bold text-amber-700 underline dark:text-amber-300">
                    Contacter l&apos;admin pour suivre →
                  </Link>
                </div>
              )}
            </div>
          )}

          {active === 'communautes' && (
            <CommunitiesList
              communities={communities}
              stats={stats}
              onDelete={handleDelete}
            />
          )}

          {active === 'co-leads' && <LeadCoLeadsPanel communities={communities} />}
          {active === 'evenements' && <LeadEventsPanel communities={communities} />}
          {active === 'messages' && <LeadAdminChat />}
          {active === 'profil' && <LeadProfilePanel />}
        </>
      )}
    </DashboardLayout>
  );
}

function CommunitiesList({
  communities,
  stats,
  onDelete,
}: {
  communities: Community[];
  stats: { total: number; owned: number };
  onDelete: (c: Community) => void;
}) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () =>
      filterBySearch(communities, search, (c) => [
        c.name,
        c.description,
        c.shortDescription,
        c.city,
        c.country,
        c.status,
        c.membershipRole === 'co_lead' ? 'co-lead' : 'responsable',
      ]),
    [communities, search],
  );

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Mes solutions SaaS ({stats.total})
        </h2>
        {stats.owned === 0 && (
          <Link
            to="/espace-lead/communautes/nouvelle"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-togo-green px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-togo-green/25 transition-colors hover:bg-togo-green-dark"
          >
            <Plus className="h-4 w-4" /> Ajouter
          </Link>
        )}
      </div>

      {communities.length > 0 && (
        <div className="mb-5">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Rechercher par nom, ville, statut…"
            size="sm"
            resultCount={filtered.length}
            totalCount={communities.length}
          />
        </div>
      )}

      {communities.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 py-20 text-center dark:border-slate-700">
          <Users2 className="h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-lg font-bold text-slate-700 dark:text-slate-200">
            Aucune solution SaaS pour le moment
          </h3>
          <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
            Créez votre première solution SaaS ou demandez au lead de vous ajouter comme co-lead.
          </p>
          <Link
            to="/espace-lead/communautes/nouvelle"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-togo-green px-5 py-3 text-sm font-bold text-white"
          >
            <Plus className="h-4 w-4" /> Créer ma solution SaaS
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <SearchEmptyState query={search.trim()} />
      ) : (
        <CommunitiesTable communities={filtered} onDelete={onDelete} />
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <div className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
      <span className={`grid h-11 w-11 place-items-center rounded-2xl sm:h-12 sm:w-12 ${color}`}>
        <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
      </span>
      <p className="mt-4 text-3xl font-black text-slate-900 dark:text-white">{value}</p>
      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

function QuickLink({ to, label, desc, accent }: { to: string; label: string; desc: string; accent?: boolean }) {
  return (
    <Link
      to={to}
      className={`block min-w-0 w-full rounded-2xl border p-4 transition-all hover:shadow-md sm:p-5 ${
        accent
          ? 'border-togo-green/30 bg-togo-green/5 hover:border-togo-green dark:border-togo-yellow/30 dark:bg-togo-yellow/5'
          : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
      }`}
    >
      <p className="font-bold text-slate-900 dark:text-white">{label}</p>
      <p className="mt-1 break-words text-xs text-slate-500 dark:text-slate-400">{desc}</p>
    </Link>
  );
}
