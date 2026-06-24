import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import CommunityForm from '../../components/dashboard/CommunityForm';
import { PageLoader } from '../../components/ui/Spinner';
import SearchableSelect from '../../components/ui/SearchableSelect';
import { useToast } from '../../components/ui/Toast';
import { buildAdminNav } from '../../lib/adminNav';
import { api, ApiError } from '../../lib/api';
import { DEFAULT_COUNTRY } from '../../data/togoData';
import type { Community, CommunityStatus, LeadSummary } from '../../types';

export default function AdminCommunityCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { notify } = useToast();

  const presetLeadId = searchParams.get('lead') ? Number(searchParams.get('lead')) : undefined;

  const [leads, setLeads] = useState<LeadSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<number>(0);
  const [status, setStatus] = useState<CommunityStatus>('approved');

  const nav = buildAdminNav();
  const goAdminTab = (tab: string) => navigate(tab === 'overview' ? '/admin' : `/admin?tab=${tab}`);

  const backTo = presetLeadId ? `/admin/leads/${presetLeadId}` : '/admin?tab=communities';

  useEffect(() => {
    (async () => {
      try {
        const res = await api.adminLeads();
        const list = res.data.leads;
        setLeads(list);
        if (presetLeadId && list.some((l) => l.id === presetLeadId)) {
          setUserId(presetLeadId);
        } else if (list[0]) {
          setUserId(list[0].id);
        }
      } catch {
        notify('Impossible de charger les leads.', 'error');
        navigate('/admin?tab=communities');
      } finally {
        setLoading(false);
      }
    })();
  }, [presetLeadId, navigate, notify]);

  const selectedLead = useMemo(
    () => leads.find((l) => l.id === userId) ?? null,
    [leads, userId],
  );

  const leadOptions = useMemo(
    () =>
      leads.map((l) => ({
        value: l.id,
        label: `${l.name} (${l.email})`,
        keywords: [l.email, l.phone],
      })),
    [leads],
  );

  const initial = useMemo<Partial<Community>>(
    () => ({
      name: '',
      description: '',
      country: DEFAULT_COUNTRY,
      tags: [],
      leaderName: selectedLead?.name ?? '',
      leaderEmail: selectedLead?.email ?? '',
      leaderPhone: selectedLead?.phone ?? '',
      status: 'approved',
    }),
    [selectedLead],
  );

  const handleSubmit = async (data: Partial<Community>) => {
    if (!userId) return;
    try {
      const res = await api.adminCreateCommunity({ ...data, userId, status });
      notify('Communauté créée.', 'success');
      const newId = res.data.community?.id;
      if (newId) navigate(`/admin/communautes/${newId}`);
      else navigate('/admin?tab=communities');
    } catch (err) {
      if (err instanceof ApiError) {
        notify(err.message, 'error');
        throw err;
      }
    }
  };

  if (loading) {
    return (
      <DashboardLayout
        title="Ajouter une communauté"
        subtitle="Chargement…"
        nav={nav}
        active="communities"
        onNavigate={goAdminTab}
      >
        <PageLoader label="Chargement des leads..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Ajouter une communauté"
      subtitle="Créer une fiche au nom d'un lead"
      nav={nav}
      active="communities"
      onNavigate={goAdminTab}
    >
      <div className="mb-6">
        <Link
          to={backTo}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-togo-green dark:text-slate-400 dark:hover:text-togo-yellow"
        >
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>
      </div>

      <div className="max-w-3xl space-y-6">
        <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400">Lead responsable</span>
            <SearchableSelect
              options={leadOptions}
              value={userId || ''}
              onChange={(v) => setUserId(Number(v))}
              placeholder="Sélectionnez un lead…"
              searchPlaceholder="Rechercher par nom ou email…"
              emptyMessage="Aucun lead trouvé."
              required
              disabled={leads.length === 0}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400">Statut initial</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as CommunityStatus)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-togo-green dark:border-slate-700 dark:bg-slate-950 dark:text-white [&>option]:bg-white [&>option]:text-slate-900 dark:[&>option]:bg-slate-800 dark:[&>option]:text-white"
            >
              <option value="approved">Approuvée</option>
              <option value="pending">En attente</option>
              <option value="rejected">Rejetée</option>
            </select>
          </label>
        </div>

        {leads.length === 0 ? (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 px-6 py-8 text-center dark:border-amber-500/30 dark:bg-amber-500/10">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
              Créez d&apos;abord un lead avant d&apos;ajouter une communauté.
            </p>
            <Link
              to="/admin?tab=leads"
              className="mt-4 inline-block text-sm font-bold text-togo-green hover:underline dark:text-togo-yellow"
            >
              Aller à la gestion des leads →
            </Link>
          </div>
        ) : (
          <CommunityForm
            key={`${userId}-${selectedLead?.email ?? ''}`}
            initial={initial}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
